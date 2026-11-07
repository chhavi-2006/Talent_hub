import json
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import IdempotencyRecord, LedgerEntry, Merchant, Transaction, Wallet
from app.services.cashback_service import (
    BASE_CATEGORY_RULES,
    calculate_cashback,
    clamp_cashback_to_cap,
    get_effective_monthly_cap,
    get_tier_rate_multiplier,
)


def get_current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


async def get_monthly_category_cashback_total(
    db: AsyncSession, student_wallet_id: int, category: str, month_key: str
) -> int:
    stmt = (
        select(func.coalesce(func.sum(Transaction.actual_cashback_paise), 0))
        .where(
            Transaction.student_wallet_id == student_wallet_id,
            Transaction.category == category.upper(),
            Transaction.month_key == month_key,
            Transaction.status == "SUCCESS",
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar() or 0)


async def get_wallet_category_limits_overview(
    db: AsyncSession, wallet: Wallet
) -> List[Dict[str, Any]]:
    month_key = get_current_month_key()
    summary = []

    for cat, rule in BASE_CATEGORY_RULES.items():
        if cat == "TOP_UP":
            continue

        effective_cap = get_effective_monthly_cap(cat, wallet.tier)
        used_paise = await get_monthly_category_cashback_total(db, wallet.id, cat, month_key)
        remaining_paise = max(0, effective_cap - used_paise)
        pct_used = round((used_paise / effective_cap * 100), 1) if effective_cap > 0 else 0.0

        tier_rate = rule.base_rate_pct * get_tier_rate_multiplier(wallet.tier)

        summary.append({
            "category": cat,
            "base_rate_pct": rule.base_rate_pct,
            "effective_rate_pct": tier_rate,
            "monthly_cap_paise": effective_cap,
            "monthly_cap_inr": round(effective_cap / 100.0, 2),
            "used_cashback_paise": used_paise,
            "used_cashback_inr": round(used_paise / 100.0, 2),
            "remaining_cap_paise": remaining_paise,
            "remaining_cap_inr": round(remaining_paise / 100.0, 2),
            "percentage_used": min(100.0, pct_used),
        })

    return summary


async def process_payment(
    db: AsyncSession,
    student_wallet: Wallet,
    merchant_id: int,
    amount_paise: int,
    idempotency_key: str,
    note: str = "",
) -> Dict[str, Any]:
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction amount must be strictly greater than zero.",
        )

    clean_key = idempotency_key.strip()
    if not clean_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An idempotency_key is required to ensure payment safety.",
        )

    # 1. Idempotency Check
    existing_idemp = await db.execute(
        select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == clean_key)
    )
    idemp_rec = existing_idemp.scalars().first()

    if idemp_rec:
        if idemp_rec.status == "COMPLETED" and idemp_rec.response_json:
            cached_data = json.loads(idemp_rec.response_json)
            cached_data["is_idempotent_replay"] = True
            return cached_data
        elif idemp_rec.status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A transaction with this idempotency key is currently in-flight. Please wait.",
            )

    # Reserve idempotency key
    idemp_entry = IdempotencyRecord(idempotency_key=clean_key, status="PENDING")
    db.add(idemp_entry)
    await db.flush()

    # 2. Validate Merchant
    merchant_stmt = select(Merchant).where(Merchant.id == merchant_id)
    m_result = await db.execute(merchant_stmt)
    merchant = m_result.scalars().first()

    if not merchant:
        idemp_entry.status = "FAILED"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus merchant with ID {merchant_id} not found.",
        )
    if not merchant.is_active:
        idemp_entry.status = "FAILED"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Merchant '{merchant.business_name}' is currently inactive.",
        )

    # 3. Check Student Balance
    if student_wallet.balance_paise < amount_paise:
        idemp_entry.status = "FAILED"
        await db.commit()
        avail_inr = round(student_wallet.balance_paise / 100.0, 2)
        req_inr = round(amount_paise / 100.0, 2)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Available: ₹{avail_inr}, Required: ₹{req_inr}.",
        )

    # 4. Fetch Merchant Wallet
    m_wallet_stmt = select(Wallet).where(Wallet.id == merchant.wallet_id)
    mw_result = await db.execute(m_wallet_stmt)
    merchant_wallet = mw_result.scalars().first()
    if not merchant_wallet:
        idemp_entry.status = "FAILED"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Merchant settlement wallet is unassigned.",
        )

    # 5. Calculate Raw and Capped Cashback
    breakdown = calculate_cashback(amount_paise, merchant.category, student_wallet.tier)
    month_key = get_current_month_key()

    current_month_used = await get_monthly_category_cashback_total(
        db, student_wallet.id, merchant.category, month_key
    )

    actual_cashback_paise = clamp_cashback_to_cap(
        raw_cashback_paise=breakdown.raw_cashback_paise,
        effective_monthly_cap_paise=breakdown.effective_monthly_cap_paise,
        current_month_accumulated_paise=current_month_used,
    )

    # 6. Apply Atomic Balance Changes
    # Student pays amount_paise, then receives actual_cashback_paise
    net_debit = amount_paise - actual_cashback_paise
    student_wallet.balance_paise -= net_debit
    merchant_wallet.balance_paise += amount_paise

    # 7. Record Transaction
    tx = Transaction(
        idempotency_key=clean_key,
        student_wallet_id=student_wallet.id,
        merchant_wallet_id=merchant_wallet.id,
        merchant_id=merchant.id,
        category=merchant.category,
        amount_paise=amount_paise,
        raw_cashback_paise=breakdown.raw_cashback_paise,
        actual_cashback_paise=actual_cashback_paise,
        month_key=month_key,
        status="SUCCESS",
        description=note.strip() or f"Payment to {merchant.business_name} ({merchant.category})",
    )
    db.add(tx)
    await db.flush()

    # 8. Record Double-Entry Ledger
    # Line 1: Debit Student for Gross Purchase
    debit_entry = LedgerEntry(
        transaction_id=tx.id,
        wallet_id=student_wallet.id,
        entry_type="DEBIT",
        amount_paise=amount_paise,
        account_category="PAYMENT_DEBIT",
        description=f"Purchase debit for {merchant.business_name}",
    )
    # Line 2: Credit Merchant for Gross Purchase
    credit_entry = LedgerEntry(
        transaction_id=tx.id,
        wallet_id=merchant_wallet.id,
        entry_type="CREDIT",
        amount_paise=amount_paise,
        account_category="PAYMENT_CREDIT",
        description=f"Settlement credit from {student_wallet.user.name if student_wallet.user else 'Student'}",
    )
    db.add_all([debit_entry, credit_entry])

    # Line 3 (if applicable): Credit Student for Cashback
    if actual_cashback_paise > 0:
        cashback_entry = LedgerEntry(
            transaction_id=tx.id,
            wallet_id=student_wallet.id,
            entry_type="CREDIT",
            amount_paise=actual_cashback_paise,
            account_category="CASHBACK_CREDIT",
            description=f"FinPay {student_wallet.tier} Tier Cashback for {merchant.category}",
        )
        db.add(cashback_entry)

    # 9. Update Idempotency Record
    response_payload = {
        "transaction_id": tx.id,
        "idempotency_key": clean_key,
        "merchant_id": merchant.id,
        "merchant_name": merchant.business_name,
        "category": merchant.category,
        "amount_paise": amount_paise,
        "amount_inr": round(amount_paise / 100.0, 2),
        "raw_cashback_paise": breakdown.raw_cashback_paise,
        "raw_cashback_inr": round(breakdown.raw_cashback_paise / 100.0, 2),
        "actual_cashback_paise": actual_cashback_paise,
        "actual_cashback_inr": round(actual_cashback_paise / 100.0, 2),
        "effective_rate_pct": breakdown.effective_rate_pct,
        "wallet_tier": student_wallet.tier,
        "monthly_cap_paise": breakdown.effective_monthly_cap_paise,
        "monthly_cap_inr": round(breakdown.effective_monthly_cap_paise / 100.0, 2),
        "category_used_after_tx_paise": current_month_used + actual_cashback_paise,
        "category_used_after_tx_inr": round((current_month_used + actual_cashback_paise) / 100.0, 2),
        "net_debited_paise": net_debit,
        "net_debited_inr": round(net_debit / 100.0, 2),
        "new_balance_paise": student_wallet.balance_paise,
        "new_balance_inr": round(student_wallet.balance_paise / 100.0, 2),
        "timestamp": tx.created_at.isoformat(),
        "is_idempotent_replay": False,
    }

    idemp_entry.status = "COMPLETED"
    idemp_entry.response_json = json.dumps(response_payload)
    await db.commit()

    return response_payload


async def top_up_wallet(
    db: AsyncSession,
    student_wallet: Wallet,
    amount_paise: int,
    idempotency_key: str,
) -> Dict[str, Any]:
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Top-up amount must be strictly greater than zero.",
        )

    clean_key = idempotency_key.strip()
    existing_idemp = await db.execute(
        select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == clean_key)
    )
    if existing_idemp.scalars().first():
        cached = existing_idemp.scalars().first()
        if cached.response_json:
            return json.loads(cached.response_json)

    idemp = IdempotencyRecord(idempotency_key=clean_key, status="PENDING")
    db.add(idemp)
    await db.flush()

    student_wallet.balance_paise += amount_paise

    month_key = get_current_month_key()
    tx = Transaction(
        idempotency_key=clean_key,
        student_wallet_id=student_wallet.id,
        merchant_wallet_id=None,
        merchant_id=None,
        category="TOP_UP",
        amount_paise=amount_paise,
        raw_cashback_paise=0,
        actual_cashback_paise=0,
        month_key=month_key,
        status="SUCCESS",
        description="Instant Campus Wallet Digital Top-up (Zero Fee)",
    )
    db.add(tx)
    await db.flush()

    ledger = LedgerEntry(
        transaction_id=tx.id,
        wallet_id=student_wallet.id,
        entry_type="CREDIT",
        amount_paise=amount_paise,
        account_category="TOP_UP",
        description="Digital top-up load",
    )
    db.add(ledger)

    payload = {
        "transaction_id": tx.id,
        "idempotency_key": clean_key,
        "type": "TOP_UP",
        "amount_paise": amount_paise,
        "amount_inr": round(amount_paise / 100.0, 2),
        "new_balance_paise": student_wallet.balance_paise,
        "new_balance_inr": round(student_wallet.balance_paise / 100.0, 2),
        "timestamp": tx.created_at.isoformat(),
    }

    idemp.status = "COMPLETED"
    idemp.response_json = json.dumps(payload)
    await db.commit()

    return payload
