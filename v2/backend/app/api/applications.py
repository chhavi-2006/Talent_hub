from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Application, JobListing, Student, User
from app.schemas.schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.services.placement_service import PlacementService
from app.services.serializers import serialize_application

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut)
async def apply(
    payload: ApplicationCreate,
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.student:
        raise HTTPException(status_code=400, detail="Student profile not found.")

    application = await PlacementService.apply_for_job(
        db, student_id=current_user.student.id, job_id=payload.job_id
    )
    return serialize_application(application)


@router.get("/me", response_model=List[ApplicationOut])
async def my_applications(
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.student:
        raise HTTPException(status_code=400, detail="Student profile not found.")

    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.job).selectinload(JobListing.company),
            selectinload(Application.interview_rounds),
            selectinload(Application.offer),
        )
        .where(Application.student_id == current_user.student.id)
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]


@router.get("/job/{job_id}", response_model=List[ApplicationOut])
async def applications_for_job(
    job_id: int,
    current_user: User = Depends(require_role("COMPANY", "COORDINATOR")),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership if company
    if current_user.role == "COMPANY":
        job_res = await db.execute(select(JobListing).where(JobListing.id == job_id))
        job = job_res.scalar_one_or_none()
        if not job or job.company_id != current_user.company.id:
            raise HTTPException(status_code=403, detail="Unauthorized: Not your job listing.")

    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.job).selectinload(JobListing.company),
            selectinload(Application.interview_rounds),
            selectinload(Application.offer),
        )
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]


@router.get("/company/mine", response_model=List[ApplicationOut])
async def my_company_applicants(
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="Company profile not found.")

    result = await db.execute(
        select(Application)
        .join(JobListing, Application.job_id == JobListing.id)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.job).selectinload(JobListing.company),
            selectinload(Application.interview_rounds),
            selectinload(Application.offer),
        )
        .where(JobListing.company_id == current_user.company.id)
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]


@router.patch("/{application_id}/status", response_model=ApplicationOut)
async def update_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    updated = await PlacementService.update_status(
        db,
        application_id=application_id,
        company_id=current_user.company.id,
        new_status=payload.status,
    )
    return serialize_application(updated)
