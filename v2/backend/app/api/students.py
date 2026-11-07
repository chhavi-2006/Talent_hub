from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Student, User
from app.schemas.schemas import StudentOut

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=List[StudentOut])
async def list_students(
    branch: Optional[str] = Query(None, description="Filter by engineering branch"),
    placement_status: Optional[str] = Query(None, description="Filter by status: UNPLACED / PLACED"),
    min_cgpa: Optional[float] = Query(None, description="Filter students with CGPA >= min_cgpa"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("COORDINATOR", "COMPANY")),
):
    query = select(Student).options(selectinload(Student.user))
    if branch:
        query = query.where(Student.branch.ilike(f"%{branch}%"))
    if placement_status:
        query = query.where(Student.placement_status == placement_status.upper())
    if min_cgpa is not None:
        query = query.where(Student.cgpa >= min_cgpa)

    result = await db.execute(query)
    students = result.scalars().all()

    return [
        StudentOut(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            email=s.user.email if s.user else "",
            usn=s.usn,
            branch=s.branch,
            cgpa=s.cgpa,
            active_backlogs=s.active_backlogs,
            placement_status=s.placement_status,
            current_package_lpa=s.current_package_lpa,
        )
        for s in students
    ]


@router.get("/me", response_model=StudentOut)
async def my_student_profile(
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.user))
        .where(Student.user_id == current_user.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return StudentOut(
        id=student.id,
        user_id=student.user_id,
        name=student.name,
        email=student.user.email if student.user else current_user.email,
        usn=student.usn,
        branch=student.branch,
        cgpa=student.cgpa,
        active_backlogs=student.active_backlogs,
        placement_status=student.placement_status,
        current_package_lpa=student.current_package_lpa,
    )


@router.get("/{student_id}", response_model=StudentOut)
async def get_student_by_id(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("COORDINATOR", "COMPANY")),
):
    result = await db.execute(
        select(Student).options(selectinload(Student.user)).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return StudentOut(
        id=student.id,
        user_id=student.user_id,
        name=student.name,
        email=student.user.email if student.user else "",
        usn=student.usn,
        branch=student.branch,
        cgpa=student.cgpa,
        active_backlogs=student.active_backlogs,
        placement_status=student.placement_status,
        current_package_lpa=student.current_package_lpa,
    )
