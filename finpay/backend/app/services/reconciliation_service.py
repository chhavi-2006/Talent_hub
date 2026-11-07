from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import LedgerEntry, Merchant, Transaction, Wallet


async def run_monthly_reconciliation(
    db: AsyncSession, month_key: str = None
) -> Dict[str, Any]:
    if not month_key:
        month_key = datetime.now(timezone.utc).strftime("%Y-%m")

    # 1. Transaction Aggregates
    tx_stmt = select(
        func.count(Transaction.id),
        func.coalesce(func.sum(Transaction.amount_paise), 0),
        func.coalesce(func.sum(Transaction.raw_cashback_paise), 0),
        func.coalesce(func.sum(Transaction.actual_cashback_paise), 0),
    ).where(Transaction.month_key == month_key, Transaction.status == "SUCCESS")

    tx_res = await db.execute(tx_stmt)
    tx_count, total_volume_paise, total_raw_paise, total_actual_paise = tx_res.first()

    # 2. Category-wise Breakdown
    cat_stmt = (
        select(
            Transaction.category,
            func.count(Transaction.id),
            func.coalesce(func.sum(Transaction.amount_paise), 0),
            func.coalesce(func.sum(Transaction.actual_cashback_paise), 0),
        )
        .where(Transaction.month_key == month_key, Transaction.status == "SUCCESS")
        .group_by(Transaction.category)
    )
    cat_res = await db.execute(cat_stmt)
    category_summary = []
    for cat, c_count, c_vol, c_cb in cat_res.all():
        category_summary.append({
            "category": cat,
            "transaction_count": c_count,
            "volume_paise": c_vol,
            "volume_inr": round(c_vol / 100.0, 2),
            "cashback_paise": c_cb,
            "cashback_inr": round(c_cb / 100.0, 2),
            "effective_cashback_ratio_pct": round((c_cb / c_vol * 100), 2) if c_vol > 0 else 0.0,
        })

    # 3. Double-Entry Ledger Verification
    ledger_debits = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount_paise), 0))
        .join(Transaction, LedgerEntry.transaction_id == Transaction.id)
        .where(
            Transaction.month_key == month_key,
            LedgerEntry.entry_type == "DEBIT",
        )
    ) or 0

    ledger_credits = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount_paise), 0))
        .join(Transaction, LedgerEntry.transaction_id == Transaction.id)
        .where(
            Transaction.month_key == month_key,
            LedgerEntry.entry_type == "CREDIT",
        )
    ) or 0

    # 4. Individual Wallet Audits
    wallets_res = await db.execute(select(Wallet))
    all_wallets = wallets_res.scalars().all()
    discrepancies: List[Dict[str, Any]] = []

    for w in all_wallets:
        # Sum credits minus debits for this wallet
        w_credits = await db.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount_paise), 0)).where(
                LedgerEntry.wallet_id == w.id, LedgerEntry.entry_type == "CREDIT"
            )
        ) or 0

        w_debits = await db.scalar(
            select(func.coalesce(func.sum(LedgerEntry.amount_paise), 0)).where(
                LedgerEntry.wallet_id == w.id, LedgerEntry.entry_type == "DEBIT"
            )
        ) or 0

        expected_balance = w_credits - w_debits

        if expected_balance != w.balance_paise:
            discrepancies.append({
                "wallet_id": w.id,
                "user_id": w.user_id,
                "wallet_type": w.wallet_type,
                "recorded_balance_paise": w.balance_paise,
                "ledger_computed_balance_paise": expected_balance,
                "variance_paise": w.balance_paise - expected_balance,
            })

    is_balanced = len(discrepancies) == 0

    return {
        "reconciliation_month": month_key,
        "audited_at": datetime.now(timezone.utc).isoformat(),
        "status": "BALANCED" if is_balanced else "DISCREPANCY_DETECTED",
        "is_healthy": is_balanced,
        "metrics": {
            "total_transactions": tx_count,
            "total_volume_paise": total_volume_paise,
            "total_volume_inr": round(total_volume_paise / 100.0, 2),
            "raw_cashback_paise": total_raw_paise,
            "raw_cashback_inr": round(total_raw_paise / 100.0, 2),
            "actual_cashback_paise": total_actual_paise,
            "actual_cashback_inr": round(total_actual_paise / 100.0, 2),
            "capped_savings_paise": total_raw_paise - total_actual_paise,
            "capped_savings_inr": round((total_raw_paise - total_actual_paise) / 100.0, 2),
        },
        "ledger_audit": {
            "total_debits_paise": ledger_debits,
            "total_credits_paise": ledger_credits,
            "net_promotional_injection_paise": total_actual_paise,
            "is_ledger_symmetric": (ledger_credits - ledger_debits) == total_actual_paise,
        },
        "category_breakdown": category_summary,
        "discrepancies": discrepancies,
        "discrepancies_count": len(discrepancies),
    }
