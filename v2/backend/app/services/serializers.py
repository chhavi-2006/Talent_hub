from typing import Optional
from app.models.models import Application, JobListing, Student
from app.schemas.schemas import ApplicationOut, InterviewRoundOut, JobOut, OfferOut
from app.services.eligibility_service import EligibilityService


def serialize_job(job: JobListing, student: Optional[Student] = None) -> dict:
    data = {
        "id": job.id,
        "company_id": job.company_id,
        "company_name": job.company.name if job.company else None,
        "role_title": job.role_title,
        "description": job.description,
        "package_lpa": job.package_lpa,
        "min_cgpa": job.min_cgpa,
        "max_backlogs": job.max_backlogs,
        "eligible_branches": job.eligible_branches,
        "is_dream_offer": job.is_dream_offer,
        "status": job.status,
        "created_at": job.created_at,
    }
    if student:
        eligible, reason = EligibilityService.verify_eligibility(student, job)
        data["eligible"] = eligible
        data["eligibility_reason"] = reason
    return data


def serialize_application(app: Application) -> dict:
    rounds = [
        {
            "id": r.id,
            "application_id": r.application_id,
            "round_number": r.round_number,
            "round_type": r.round_type,
            "scheduled_at": r.scheduled_at,
            "status": r.status,
            "result": r.result,
            "feedback": r.feedback,
            "score": r.score,
        }
        for r in sorted(app.interview_rounds, key=lambda x: x.round_number)
    ]

    offer_data = None
    if app.offer:
        offer_data = {
            "id": app.offer.id,
            "application_id": app.offer.application_id,
            "package_lpa": app.offer.package_lpa,
            "status": app.offer.status,
            "issued_at": app.offer.issued_at,
            "responded_at": app.offer.responded_at,
        }

    return {
        "id": app.id,
        "student_id": app.student_id,
        "job_id": app.job_id,
        "status": app.status,
        "applied_at": app.applied_at,
        "updated_at": app.updated_at,
        "student_name": app.student.name if app.student else None,
        "student_usn": app.student.usn if app.student else None,
        "student_branch": app.student.branch if app.student else None,
        "student_cgpa": app.student.cgpa if app.student else None,
        "student_backlogs": app.student.active_backlogs if app.student else None,
        "job_title": app.job.role_title if app.job else None,
        "company_name": app.job.company.name if (app.job and app.job.company) else None,
        "package_lpa": app.job.package_lpa if app.job else None,
        "is_dream_offer": app.job.is_dream_offer if app.job else None,
        "interview_rounds": rounds,
        "offer": offer_data,
    }
