from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.models import Company, Student, User
from app.schemas.schemas import (
    CompanyRegisterRequest,
    LoginRequest,
    StudentRegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/student", response_model=TokenResponse)
async def register_student(payload: StudentRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Check USN uniqueness
    existing_usn = await db.execute(select(Student).where(Student.usn == payload.usn.upper()))
    if existing_usn.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A student with this USN/Roll No is already registered.")

    # Create user and student in atomic transaction
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role="STUDENT",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        name=payload.name.strip(),
        usn=payload.usn.strip().upper(),
        branch=payload.branch.strip(),
        cgpa=payload.cgpa,
        active_backlogs=payload.active_backlogs,
        placement_status="UNPLACED",
        current_package_lpa=0.0,
    )
    db.add(student)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=student.name,
        email=user.email,
        entity_id=student.id,
        placement_status=student.placement_status,
        current_package_lpa=student.current_package_lpa,
    )


@router.post("/register/company", response_model=TokenResponse)
async def register_company(payload: CompanyRegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role="COMPANY",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    company = Company(
        user_id=user.id,
        name=payload.name.strip(),
        description=payload.description.strip(),
        website=payload.website.strip(),
        is_verified=True,
    )
    db.add(company)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=company.name,
        email=user.email,
        entity_id=company.id,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(selectinload(User.student), selectinload(User.company))
        .where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator.",
        )

    # Resolve accurate entity name and id
    entity_id = None
    display_name = user.email.split("@")[0]
    placement_status = None
    current_package = None

    if user.role == "STUDENT" and user.student:
        entity_id = user.student.id
        display_name = user.student.name
        placement_status = user.student.placement_status
        current_package = user.student.current_package_lpa
    elif user.role == "COMPANY" and user.company:
        entity_id = user.company.id
        display_name = user.company.name
    elif user.role == "COORDINATOR":
        display_name = "Placement Coordinator"

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=display_name,
        email=user.email,
        entity_id=entity_id,
        placement_status=placement_status,
        current_package_lpa=current_package,
    )


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    display_name = current_user.email.split("@")[0]
    entity_id = None
    placement_status = None
    current_package = None

    if current_user.role == "STUDENT" and current_user.student:
        entity_id = current_user.student.id
        display_name = current_user.student.name
        placement_status = current_user.student.placement_status
        current_package = current_user.student.current_package_lpa
    elif current_user.role == "COMPANY" and current_user.company:
        entity_id = current_user.company.id
        display_name = current_user.company.name
    elif current_user.role == "COORDINATOR":
        display_name = "Placement Coordinator"

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "name": display_name,
        "entity_id": entity_id,
        "placement_status": placement_status,
        "current_package_lpa": current_package,
        "is_active": current_user.is_active,
    }
