from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Application, Company, JobListing, Offer, Student, User
from app.schemas.schemas import ApplicationOut, CoordinatorStats
from app.services.serializers import serialize_application

router = APIRouter(prefix="/coordinator", tags=["coordinator"])


@router.get("/stats", response_model=CoordinatorStats)
async def get_coordinator_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("COORDINATOR")),
):
    # Total students
    students_res = await db.execute(select(Student))
    students = students_res.scalars().all()
    total_students = len(students)
    placed_students = sum(1 for s in students if s.placement_status == "PLACED")
    unplaced_students = total_students - placed_students

    # Total companies
    companies_res = await db.execute(select(Company))
    total_companies = len(companies_res.scalars().all())

    # Total jobs
    jobs_res = await db.execute(select(JobListing))
    jobs = jobs_res.scalars().all()
    total_jobs = len(jobs)
    active_jobs = sum(1 for j in jobs if j.status == "OPEN")

    # Applications
    apps_res = await db.execute(select(Application).options(selectinload(Application.offer)))
    apps = apps_res.scalars().all()
    total_applications = len(apps)

    # Offers
    offers_issued = sum(1 for a in apps if a.offer is not None)
    accepted_offers = [a.offer for a in apps if a.offer and a.offer.status == "ACCEPTED"]
    offers_accepted = len(accepted_offers)

    placement_percentage = (
        round((placed_students / total_students * 100), 1) if total_students > 0 else 0.0
    )

    accepted_packages = [o.package_lpa for o in accepted_offers if o.package_lpa > 0]
    avg_package = (
        round(sum(accepted_packages) / len(accepted_packages), 2)
        if accepted_packages
        else 0.0
    )
    highest_package = max(accepted_packages) if accepted_packages else 0.0

    return CoordinatorStats(
        total_students=total_students,
        placed_students=placed_students,
        unplaced_students=unplaced_students,
        total_companies=total_companies,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications,
        offers_issued=offers_issued,
        offers_accepted=offers_accepted,
        placement_percentage=placement_percentage,
        avg_package_lpa=avg_package,
        highest_package_lpa=highest_package,
    )


@router.get("/applications", response_model=List[ApplicationOut])
async def all_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("COORDINATOR")),
):
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.job).selectinload(JobListing.company),
            selectinload(Application.interview_rounds),
            selectinload(Application.offer),
        )
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("COORDINATOR")),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own coordinator account.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user.id, "email": user.email, "is_active": user.is_active}
