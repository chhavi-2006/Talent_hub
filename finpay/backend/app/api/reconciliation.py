from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_role
from app.models.models import LedgerEntry, User
from app.services.reconciliation_service import run_monthly_reconciliation

router = APIRouter(prefix="/reconciliation", tags=["Financial Reconciliation & Auditing"])


@router.get("/report")
async def get_reconciliation_report(
    month: Optional[str] = Query(None, description="Month in format YYYY-MM"),
    current_user: User = Depends(require_role("AUDITOR")),
    db: AsyncSession = Depends(get_db),
):
    report = await run_monthly_reconciliation(db=db, month_key=month)
    return report


@router.get("/ledger")
async def get_ledger_entries(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_role("AUDITOR")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LedgerEntry)
        .options(selectinload(LedgerEntry.transaction), selectinload(LedgerEntry.wallet))
        .order_by(desc(LedgerEntry.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    return [
        {
            "id": e.id,
            "transaction_id": e.transaction_id,
            "wallet_id": e.wallet_id,
            "wallet_tier": e.wallet.tier if e.wallet else None,
            "wallet_type": e.wallet.wallet_type if e.wallet else None,
            "entry_type": e.entry_type,
            "amount_paise": e.amount_paise,
            "amount_inr": round(e.amount_paise / 100.0, 2),
            "account_category": e.account_category,
            "description": e.description,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
