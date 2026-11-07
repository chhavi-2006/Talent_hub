import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Merchant, User, Wallet
from app.schemas.schemas import BillOut, CreateBillRequest, MerchantOut

router = APIRouter(prefix="/merchants", tags=["Merchant Directory & POS Terminal"])


@router.get("", response_model=list[MerchantOut])
async def list_merchants(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Merchant)
        .options(selectinload(Merchant.wallet))
        .where(Merchant.is_active == True)
        .order_by(Merchant.business_name)
    )
    result = await db.execute(stmt)
    merchants = result.scalars().all()

    output = []
    for m in merchants:
        output.append(
            MerchantOut(
                id=m.id,
                business_name=m.business_name,
                category=m.category,
                location=m.location,
                is_active=m.is_active,
                wallet_id=m.wallet_id,
                wallet_balance_paise=m.wallet.balance_paise if m.wallet else 0,
                wallet_balance_inr=round((m.wallet.balance_paise if m.wallet else 0) / 100.0, 2),
            )
        )
    return output


@router.get("/{merchant_id}", response_model=MerchantOut)
async def get_merchant(merchant_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Merchant)
        .options(selectinload(Merchant.wallet))
        .where(Merchant.id == merchant_id)
    )
    res = await db.execute(stmt)
    m = res.scalars().first()
    if not m:
        raise HTTPException(status_code=404, detail="Merchant not found.")

    return MerchantOut(
        id=m.id,
        business_name=m.business_name,
        category=m.category,
        location=m.location,
        is_active=m.is_active,
        wallet_id=m.wallet_id,
        wallet_balance_paise=m.wallet.balance_paise if m.wallet else 0,
        wallet_balance_inr=round((m.wallet.balance_paise if m.wallet else 0) / 100.0, 2),
    )


@router.post("/pos/create-bill", response_model=BillOut)
async def create_pos_bill(
    payload: CreateBillRequest,
    current_user: User = Depends(require_role("MERCHANT")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Merchant).where(Merchant.user_id == current_user.id)
    res = await db.execute(stmt)
    merchant = res.scalars().first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not linked to user.")

    bill_id = f"BILL-{uuid.uuid4().hex[:8].upper()}"
    suggested_key = f"IDEMP-{bill_id}-{int(datetime.now().timestamp())}"

    return BillOut(
        bill_id=bill_id,
        merchant_id=merchant.id,
        merchant_name=merchant.business_name,
        category=merchant.category,
        amount_paise=payload.amount_paise,
        amount_inr=round(payload.amount_paise / 100.0, 2),
        suggested_idempotency_key=suggested_key,
        created_at=datetime.now(timezone.utc),
    )
