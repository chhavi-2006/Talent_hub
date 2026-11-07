from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User
from app.schemas.schemas import ApplicationOut, OfferCreate, OfferRespond
from app.services.placement_service import PlacementService
from app.services.serializers import serialize_application

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("", response_model=ApplicationOut)
async def issue_offer(
    payload: OfferCreate,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="Company profile not found.")

    await PlacementService.issue_offer(
        db,
        application_id=payload.application_id,
        company_id=current_user.company.id,
        package_lpa=payload.package_lpa,
    )
    application = await PlacementService.get_application_with_details(db, payload.application_id)
    return serialize_application(application)


@router.patch("/{application_id}/respond", response_model=ApplicationOut)
async def respond_to_offer(
    application_id: int,
    payload: OfferRespond,
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.student:
        raise HTTPException(status_code=400, detail="Student profile not found.")

    await PlacementService.respond_to_offer(
        db,
        application_id=application_id,
        student_id=current_user.student.id,
        accept=payload.accept,
    )
    application = await PlacementService.get_application_with_details(db, application_id)
    return serialize_application(application)
