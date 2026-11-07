from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Company, User
from app.schemas.schemas import CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[CompanyOut])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("STUDENT", "COORDINATOR", "COMPANY")),
):
    result = await db.execute(select(Company).options(selectinload(Company.user)))
    companies = result.scalars().all()
    return [
        CompanyOut(
            id=c.id,
            user_id=c.user_id,
            name=c.name,
            email=c.user.email if c.user else "",
            description=c.description,
            website=c.website,
            is_verified=c.is_verified,
        )
        for c in companies
    ]


@router.get("/me", response_model=CompanyOut)
async def my_company_profile(
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company).options(selectinload(Company.user)).where(Company.user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    return CompanyOut(
        id=company.id,
        user_id=company.user_id,
        name=company.name,
        email=company.user.email if company.user else current_user.email,
        description=company.description,
        website=company.website,
        is_verified=company.is_verified,
    )
