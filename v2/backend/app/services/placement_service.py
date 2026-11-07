from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.models import Application, InterviewRound, JobListing, Offer, Student
from app.services.eligibility_service import EligibilityService


def utc_now():
    return datetime.now(timezone.utc)


class PlacementService:
    @staticmethod
    async def get_application_with_details(db: AsyncSession, application_id: int) -> Optional[Application]:
        result = await db.execute(
            select(Application)
            .options(
                selectinload(Application.student).selectinload(Student.user),
                selectinload(Application.job).selectinload(JobListing.company),
                selectinload(Application.interview_rounds),
                selectinload(Application.offer),
            )
            .where(Application.id == application_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def apply_for_job(db: AsyncSession, student_id: int, job_id: int) -> Application:
        # Load student and job
        student_res = await db.execute(
            select(Student).options(selectinload(Student.user)).where(Student.id == student_id)
        )
        student = student_res.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found")

        job_res = await db.execute(
            select(JobListing).options(selectinload(JobListing.company)).where(JobListing.id == job_id)
        )
        job = job_res.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job listing not found")

        # Check existing application
        existing_res = await db.execute(
            select(Application).where(Application.student_id == student_id, Application.job_id == job_id)
        )
        if existing_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="You have already applied for this job listing.")

        # Eligibility check
        is_eligible, reason = EligibilityService.verify_eligibility(student, job)
        if not is_eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Application Rejected by Policy: {reason}",
            )

        # Create application
        application = Application(student_id=student_id, job_id=job_id, status="APPLIED")
        db.add(application)
        await db.commit()
        await db.refresh(application)
        return await PlacementService.get_application_with_details(db, application.id)

    @staticmethod
    async def update_status(
        db: AsyncSession, application_id: int, company_id: int, new_status: str
    ) -> Application:
        application = await PlacementService.get_application_with_details(db, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.job.company_id != company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Not your job listing.")

        if new_status not in ("SHORTLISTED", "REJECTED"):
            raise HTTPException(status_code=400, detail="Invalid status transition. Allowed: SHORTLISTED, REJECTED.")

        if new_status == "SHORTLISTED" and application.status != "APPLIED":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot shortlist candidate currently in '{application.status}' state.",
            )

        application.status = new_status
        await db.commit()
        await db.refresh(application)
        return application

    @staticmethod
    async def schedule_interview_round(
        db: AsyncSession,
        application_id: int,
        company_id: int,
        round_number: int,
        round_type: str,
        scheduled_at: datetime,
    ) -> InterviewRound:
        application = await PlacementService.get_application_with_details(db, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.job.company_id != company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Not your job listing.")

        if application.status not in ("SHORTLISTED", "INTERVIEWING", "INTERVIEW_PASSED"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot schedule interview. Candidate must be SHORTLISTED or in progress (current: {application.status}).",
            )

        # Query existing rounds directly to avoid session caching issues
        rounds_res = await db.execute(
            select(InterviewRound)
            .where(InterviewRound.application_id == application_id)
            .order_by(InterviewRound.round_number)
        )
        existing_rounds = rounds_res.scalars().all()

        if round_number > 1:
            prev_round = next((r for r in existing_rounds if r.round_number == round_number - 1), None)
            if not prev_round:
                raise HTTPException(
                    status_code=400,
                    detail=f"Round {round_number - 1} must exist before scheduling Round {round_number}.",
                )
            if prev_round.result != "PASS":
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot schedule Round {round_number}: Round {round_number - 1} did not result in PASS (current: {prev_round.result}).",
                )

        current_round = next((r for r in existing_rounds if r.round_number == round_number), None)
        if current_round:
            # Reschedule existing round
            current_round.scheduled_at = scheduled_at
            current_round.round_type = round_type
            current_round.status = "SCHEDULED"
            round_obj = current_round
        else:
            round_obj = InterviewRound(
                application_id=application_id,
                round_number=round_number,
                round_type=round_type,
                scheduled_at=scheduled_at,
                status="SCHEDULED",
                result="PENDING",
            )
            db.add(round_obj)

        application.status = "INTERVIEWING"
        await db.commit()
        await db.refresh(round_obj)
        return round_obj

    @staticmethod
    async def record_interview_result(
        db: AsyncSession,
        application_id: int,
        company_id: int,
        round_number: int,
        result: str,
        feedback: str = "",
        score: Optional[float] = None,
    ) -> InterviewRound:
        application = await PlacementService.get_application_with_details(db, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.job.company_id != company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Not your job listing.")

        if result not in ("PASS", "FAIL"):
            raise HTTPException(status_code=400, detail="Invalid result. Must be PASS or FAIL.")

        round_res = await db.execute(
            select(InterviewRound).where(
                InterviewRound.application_id == application_id,
                InterviewRound.round_number == round_number,
            )
        )
        round_obj = round_res.scalar_one_or_none()
        if not round_obj:
            raise HTTPException(status_code=404, detail=f"Interview round {round_number} not found.")

        round_obj.result = result
        round_obj.status = "COMPLETED"
        round_obj.feedback = feedback
        if score is not None:
            round_obj.score = score

        if result == "FAIL":
            application.status = "REJECTED"
        else:
            application.status = "INTERVIEW_PASSED"

        await db.commit()
        await db.refresh(round_obj)
        return round_obj

    @staticmethod
    async def issue_offer(
        db: AsyncSession,
        application_id: int,
        company_id: int,
        package_lpa: Optional[float] = None,
    ) -> Offer:
        application = await PlacementService.get_application_with_details(db, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.job.company_id != company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Not your job listing.")

        # Backend State Machine Guard: candidate must have passed interviews!
        if application.status != "INTERVIEW_PASSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot issue offer: candidate status is '{application.status}'. Candidate must pass all interview rounds first.",
            )

        rounds_res = await db.execute(
            select(InterviewRound).where(InterviewRound.application_id == application_id)
        )
        all_rounds = rounds_res.scalars().all()
        if not all_rounds or any(r.result != "PASS" for r in all_rounds):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot issue offer: all scheduled interview rounds must have result 'PASS'.",
            )

        # Check existing offer
        if application.offer:
            raise HTTPException(status_code=400, detail="Offer already issued for this application.")

        final_package = package_lpa if (package_lpa and package_lpa > 0) else application.job.package_lpa

        offer = Offer(application_id=application_id, package_lpa=final_package, status="ISSUED")
        db.add(offer)
        application.status = "OFFERED"
        await db.commit()
        await db.refresh(offer)
        return offer

    @staticmethod
    async def respond_to_offer(
        db: AsyncSession, application_id: int, student_id: int, accept: bool
    ) -> Offer:
        app_res = await db.execute(
            select(Application)
            .options(
                selectinload(Application.student),
                selectinload(Application.job),
            )
            .where(Application.id == application_id)
        )
        application = app_res.scalar_one_or_none()
        if not application or application.student_id != student_id:
            raise HTTPException(status_code=404, detail="Application not found.")

        offer_res = await db.execute(
            select(Offer).where(Offer.application_id == application_id)
        )
        offer = offer_res.scalar_one_or_none()
        if not offer or offer.status != "ISSUED":
            raise HTTPException(status_code=400, detail="No active issued offer available for response.")

        student = application.student

        if not accept:
            offer.status = "DECLINED"
            offer.responded_at = utc_now()
            application.status = "DECLINED"
            await db.commit()
            return offer

        # --- ONE-OFFER & DREAM POLICY ENFORCEMENT ---
        if student.placement_status == "PLACED":
            # Check if this offer qualifies as a Dream Offer upgrade
            min_dream = max(
                student.current_package_lpa * settings.DREAM_OFFER_MULTIPLIER,
                settings.DREAM_OFFER_THRESHOLD_LPA,
            )
            is_dream = application.job.is_dream_offer or (offer.package_lpa >= min_dream)
            if not is_dream:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Placement Policy Restriction: You already accepted an offer at {student.current_package_lpa:.1f} LPA. Only Dream Category offers (>= {min_dream:.1f} LPA) can be accepted.",
                )

        # Accept the offer
        offer.status = "ACCEPTED"
        offer.responded_at = utc_now()
        application.status = "ACCEPTED"
        student.placement_status = "PLACED"
        student.current_package_lpa = offer.package_lpa

        # --- AUTOMATIC WITHDRAWAL OF ALL OTHER APPLICATIONS ---
        # Find all other non-dream pending applications and auto-withdraw them
        other_apps_res = await db.execute(
            select(Application)
            .options(selectinload(Application.job), selectinload(Application.offer))
            .where(
                Application.student_id == student_id,
                Application.id != application_id,
                Application.status.in_(["APPLIED", "SHORTLISTED", "INTERVIEWING", "INTERVIEW_PASSED", "OFFERED"]),
            )
        )
        other_apps = other_apps_res.scalars().all()

        for other_app in other_apps:
            # If the other job is not a higher dream offer, withdraw it
            other_app.status = "WITHDRAWN_PLACED"
            if other_app.offer and other_app.offer.status == "ISSUED":
                other_app.offer.status = "DECLINED"
                other_app.offer.responded_at = utc_now()

        # Atomic commit
        await db.commit()
        await db.refresh(offer)
        return offer
