from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import LedgerEntry, Merchant, Transaction, User, Wallet
from app.schemas.schemas import PaymentRequest, TransactionOut
from app.services.payment_service import process_payment

router = APIRouter(prefix="/payments", tags=["Payment Processing"])


@router.post("/pay")
async def execute_payment(
    payload: PaymentRequest,
    current_user: User = Depends(require_role("STUDENT")),
    db: AsyncSession = Depends(get_db),
):
    w_stmt = select(Wallet).where(Wallet.user_id == current_user.id)
    w_res = await db.execute(w_stmt)
    student_wallet = w_res.scalars().first()

    if not student_wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student wallet not found.",
        )

    receipt = await process_payment(
        db=db,
        student_wallet=student_wallet,
        merchant_id=payload.merchant_id,
        amount_paise=payload.amount_paise,
        idempotency_key=payload.idempotency_key,
        note=payload.note or "",
    )
    return receipt


@router.get("/history")
async def get_transaction_history(
    category: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.merchant))
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )

    if current_user.role == "STUDENT":
        w_stmt = select(Wallet.id).where(Wallet.user_id == current_user.id)
        w_id = (await db.execute(w_stmt)).scalar()
        stmt = stmt.where(Transaction.student_wallet_id == w_id)
    elif current_user.role == "MERCHANT":
        m_stmt = select(Merchant.id).where(Merchant.user_id == current_user.id)
        m_id = (await db.execute(m_stmt)).scalar()
        stmt = stmt.where(Transaction.merchant_id == m_id)

    if category:
        stmt = stmt.where(Transaction.category == category.upper())

    result = await db.execute(stmt)
    transactions = result.scalars().all()

    output = []
    for tx in transactions:
        output.append({
            "id": tx.id,
            "idempotency_key": tx.idempotency_key,
            "category": tx.category,
            "amount_paise": tx.amount_paise,
            "amount_inr": round(tx.amount_paise / 100.0, 2),
            "raw_cashback_paise": tx.raw_cashback_paise,
            "raw_cashback_inr": round(tx.raw_cashback_paise / 100.0, 2),
            "actual_cashback_paise": tx.actual_cashback_paise,
            "actual_cashback_inr": round(tx.actual_cashback_paise / 100.0, 2),
            "month_key": tx.month_key,
            "status": tx.status,
            "description": tx.description,
            "merchant_id": tx.merchant_id,
            "merchant_name": tx.merchant.business_name if tx.merchant else "System Top-Up",
            "created_at": tx.created_at.isoformat(),
        })

    return output


@router.get("/{tx_id}")
async def get_transaction_details(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.merchant), selectinload(Transaction.ledger_entries))
        .where(Transaction.id == tx_id)
    )
    res = await db.execute(stmt)
    tx = res.scalars().first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    ledger = [
        {
            "id": entry.id,
            "wallet_id": entry.wallet_id,
            "entry_type": entry.entry_type,
            "amount_paise": entry.amount_paise,
            "amount_inr": round(entry.amount_paise / 100.0, 2),
            "account_category": entry.account_category,
            "description": entry.description,
            "created_at": entry.created_at.isoformat(),
        }
        for entry in tx.ledger_entries
    ]

    return {
        "id": tx.id,
        "idempotency_key": tx.idempotency_key,
        "category": tx.category,
        "amount_paise": tx.amount_paise,
        "amount_inr": round(tx.amount_paise / 100.0, 2),
        "raw_cashback_paise": tx.raw_cashback_paise,
        "raw_cashback_inr": round(tx.raw_cashback_paise / 100.0, 2),
        "actual_cashback_paise": tx.actual_cashback_paise,
        "actual_cashback_inr": round(tx.actual_cashback_paise / 100.0, 2),
        "status": tx.status,
        "description": tx.description,
        "merchant_name": tx.merchant.business_name if tx.merchant else "System Top-Up",
        "created_at": tx.created_at.isoformat(),
        "ledger_entries": ledger,
    }
