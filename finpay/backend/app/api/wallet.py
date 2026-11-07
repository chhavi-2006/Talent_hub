from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, Wallet
from app.schemas.schemas import TierUpgradeRequest, TopUpRequest, WalletOut
from app.services.payment_service import (
    get_wallet_category_limits_overview,
    top_up_wallet,
)

router = APIRouter(prefix="/wallet", tags=["Wallet Operations"])


@router.get("/mine", response_model=WalletOut)
async def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Wallet).where(Wallet.user_id == current_user.id)
    result = await db.execute(stmt)
    wallet = result.scalars().first()

    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet account not linked for this user.",
        )

    limits = await get_wallet_category_limits_overview(db, wallet)

    return WalletOut(
        id=wallet.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        wallet_type=wallet.wallet_type,
        tier=wallet.tier,
        balance_paise=wallet.balance_paise,
        balance_inr=round(wallet.balance_paise / 100.0, 2),
        currency=wallet.currency,
        limits_summary=limits,
    )


@router.get("/limits")
async def get_category_limits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Wallet).where(Wallet.user_id == current_user.id)
    result = await db.execute(stmt)
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    limits = await get_wallet_category_limits_overview(db, wallet)
    return {
        "tier": wallet.tier,
        "limits": limits,
    }


@router.post("/topup")
async def handle_top_up(
    payload: TopUpRequest,
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Wallet).where(Wallet.user_id == current_user.id)
    result = await db.execute(stmt)
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Student wallet not found.")

    receipt = await top_up_wallet(
        db=db,
        student_wallet=wallet,
        amount_paise=payload.amount_paise,
        idempotency_key=payload.idempotency_key,
    )
    return receipt


@router.post("/tier")
async def update_wallet_tier(
    payload: TierUpgradeRequest,
    current_user: User = Depends(require_role("STUDENT", "AUDITOR")),
    db: AsyncSession = Depends(get_db),
):
    target_tier = payload.new_tier.strip().upper()
    if target_tier not in ["BASIC", "PRIME", "PREMIUM"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier must be one of: 'BASIC', 'PRIME', 'PREMIUM'",
        )

    stmt = select(Wallet).where(Wallet.user_id == current_user.id)
    result = await db.execute(stmt)
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    wallet.tier = target_tier
    await db.commit()

    limits = await get_wallet_category_limits_overview(db, wallet)

    return {
        "ok": True,
        "new_tier": wallet.tier,
        "balance_paise": wallet.balance_paise,
        "balance_inr": round(wallet.balance_paise / 100.0, 2),
        "limits": limits,
    }
