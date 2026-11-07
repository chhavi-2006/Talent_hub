from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import JobListing, Student, User
from app.schemas.schemas import JobCreate, JobOut, JobUpdate
from app.services.serializers import serialize_job

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=List[JobOut])
async def list_jobs(
    status_filter: Optional[str] = Query("OPEN", description="Filter by status (OPEN/CLOSED/ALL)"),
    is_dream: Optional[bool] = Query(None, description="Filter Dream Tier jobs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(JobListing).options(selectinload(JobListing.company))
    if status_filter and status_filter.upper() != "ALL":
        query = query.where(JobListing.status == status_filter.upper())
    if is_dream is not None:
        query = query.where(JobListing.is_dream_offer == is_dream)

    result = await db.execute(query.order_by(JobListing.created_at.desc()))
    jobs = result.scalars().all()

    student = None
    if current_user.role == "STUDENT":
        s_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
        student = s_res.scalar_one_or_none()

    return [serialize_job(job, student) for job in jobs]


@router.get("/mine", response_model=List[JobOut])
async def my_posted_jobs(
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="No company profile associated with this account.")

    result = await db.execute(
        select(JobListing)
        .options(selectinload(JobListing.company))
        .where(JobListing.company_id == current_user.company.id)
        .order_by(JobListing.created_at.desc())
    )
    jobs = result.scalars().all()
    return [serialize_job(job) for job in jobs]


@router.post("", response_model=JobOut)
async def create_job(
    payload: JobCreate,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="No company profile associated with this account.")

    job = JobListing(
        company_id=current_user.company.id,
        role_title=payload.role_title.strip(),
        description=payload.description.strip(),
        package_lpa=payload.package_lpa,
        min_cgpa=payload.min_cgpa,
        max_backlogs=payload.max_backlogs,
        eligible_branches=payload.eligible_branches.strip(),
        is_dream_offer=payload.is_dream_offer,
        status="OPEN",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Re-fetch with company relationship
    result = await db.execute(
        select(JobListing).options(selectinload(JobListing.company)).where(JobListing.id == job.id)
    )
    return serialize_job(result.scalar_one())


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(JobListing).options(selectinload(JobListing.company)).where(JobListing.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    student = None
    if current_user.role == "STUDENT":
        s_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
        student = s_res.scalar_one_or_none()

    return serialize_job(job, student)


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    payload: JobUpdate,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobListing).options(selectinload(JobListing.company)).where(JobListing.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    if job.company_id != current_user.company.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You do not own this job listing.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(job, field, val)

    await db.commit()
    await db.refresh(job)
    return serialize_job(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_or_close_job(
    job_id: int,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobListing).where(JobListing.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    if job.company_id != current_user.company.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You do not own this job listing.")

    # Mark as CLOSED rather than destructive delete to preserve applicant history
    job.status = "CLOSED"
    await db.commit()
