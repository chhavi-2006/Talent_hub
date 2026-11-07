from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User
from app.schemas.schemas import (
    ApplicationOut,
    InterviewRoundCreate,
    InterviewRoundResult,
)
from app.services.placement_service import PlacementService
from app.services.serializers import serialize_application

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("/schedule", response_model=ApplicationOut)
async def schedule_interview_round(
    payload: InterviewRoundCreate,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="Company profile not found.")

    await PlacementService.schedule_interview_round(
        db,
        application_id=payload.application_id,
        company_id=current_user.company.id,
        round_number=payload.round_number,
        round_type=payload.round_type,
        scheduled_at=payload.scheduled_at,
    )
    application = await PlacementService.get_application_with_details(db, payload.application_id)
    return serialize_application(application)


@router.patch("/{application_id}/round/{round_number}/result", response_model=ApplicationOut)
async def record_round_result(
    application_id: int,
    round_number: int,
    payload: InterviewRoundResult,
    current_user: User = Depends(require_role("COMPANY")),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.company:
        raise HTTPException(status_code=400, detail="Company profile not found.")

    await PlacementService.record_interview_result(
        db,
        application_id=application_id,
        company_id=current_user.company.id,
        round_number=round_number,
        result=payload.result,
        feedback=payload.feedback,
        score=payload.score,
    )
    application = await PlacementService.get_application_with_details(db, application_id)
    return serialize_application(application)
