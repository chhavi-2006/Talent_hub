from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.models import (
    CashbackRule,
    IdempotencyRecord,
    LedgerEntry,
    Merchant,
    Transaction,
    User,
    Wallet,
)
from app.services.cashback_service import BASE_CATEGORY_RULES

DEFAULT_PASSWORD = "password123"


async def seed_finpay_if_empty(db: AsyncSession):
    existing = await db.execute(select(User))
    if existing.scalars().first():
        return

    month_key = datetime.now(timezone.utc).strftime("%Y-%m")

    # 1. Seed Cashback Rules
    for cat, spec in BASE_CATEGORY_RULES.items():
        rule = CashbackRule(
            category=cat,
            base_rate_pct=spec.base_rate_pct,
            basic_monthly_cap_paise=spec.basic_monthly_cap_paise,
            description=f"{cat} cashback rule: {spec.base_rate_pct}% base, ₹{spec.basic_monthly_cap_paise // 100} monthly cap",
        )
        db.add(rule)
    await db.flush()

    # 2. Seed Auditor
    auditor_user = User(
        email="auditor@finpay.edu",
        name="Campus Finance Auditor",
        hashed_password=hash_password(DEFAULT_PASSWORD),
        role="AUDITOR",
        is_active=True,
    )
    db.add(auditor_user)
    await db.flush()

    # 3. Seed Merchants
    merchant_specs = [
        ("Campus Canteen — Block A", "canteen@merchants.finpay.edu", "CANTEEN", "Food Court Ground Floor", 2500000),
        ("Central Campus Stationery", "stationery@merchants.finpay.edu", "STATIONERY", "Academic Block 1", 1200000),
        ("Campus Transit Shuttle", "transit@merchants.finpay.edu", "TRANSPORT", "North Gate Transit Bay", 850000),
        ("Campus Digital Book Store", "bookstore@merchants.finpay.edu", "ONLINE", "Student Activity Center", 1800000),
    ]

    merchants_list = []
    for b_name, email, cat, loc, init_bal in merchant_specs:
        m_user = User(
            email=email,
            name=b_name,
            hashed_password=hash_password(DEFAULT_PASSWORD),
            role="MERCHANT",
            is_active=True,
        )
        db.add(m_user)
        await db.flush()

        m_wallet = Wallet(
            user_id=m_user.id,
            wallet_type="MERCHANT",
            tier="BASIC",
            balance_paise=init_bal,
        )
        db.add(m_wallet)
        await db.flush()

        merchant = Merchant(
            user_id=m_user.id,
            wallet_id=m_wallet.id,
            business_name=b_name,
            category=cat,
            location=loc,
            is_active=True,
        )
        db.add(merchant)
        merchants_list.append((merchant, m_wallet))

    await db.flush()

    # 4. Seed Students
    student_specs = [
        ("Rahul Sharma", "rahul@student.finpay.edu", "BASIC", 150000),       # ₹1,500
        ("Priya Nair", "priya@student.finpay.edu", "PRIME", 400000),         # ₹4,000
        ("Sneha Patil", "sneha@student.finpay.edu", "PREMIUM", 800000),      # ₹8,000
    ]

    student_wallets = []
    for name, email, tier, init_bal in student_specs:
        s_user = User(
            email=email,
            name=name,
            hashed_password=hash_password(DEFAULT_PASSWORD),
            role="STUDENT",
            is_active=True,
        )
        db.add(s_user)
        await db.flush()

        s_wallet = Wallet(
            user_id=s_user.id,
            wallet_type="STUDENT",
            tier=tier,
            balance_paise=init_bal,
        )
        db.add(s_wallet)
        student_wallets.append((s_user, s_wallet))

    await db.flush()

    # 5. Seed Initial Transactions
    canteen, canteen_wallet = merchants_list[0]
    stationery, stationery_wallet = merchants_list[1]
    shuttle, shuttle_wallet = merchants_list[2]

    # Sample TX 1: Rahul (BASIC) pays Canteen ₹100
    r_user, r_wallet = student_wallets[0]
    tx1_amt = 10000  # ₹100
    tx1_cb = 200     # 2% of ₹100 = ₹2
    r_wallet.balance_paise -= (tx1_amt - tx1_cb)
    canteen_wallet.balance_paise += tx1_amt

    tx1 = Transaction(
        idempotency_key="SEED-TX-RAHUL-CANTEEN-001",
        student_wallet_id=r_wallet.id,
        merchant_wallet_id=canteen_wallet.id,
        merchant_id=canteen.id,
        category="CANTEEN",
        amount_paise=tx1_amt,
        raw_cashback_paise=tx1_cb,
        actual_cashback_paise=tx1_cb,
        month_key=month_key,
        status="SUCCESS",
        description="Afternoon Lunch Combo — Student Canteen",
    )
    db.add(tx1)
    await db.flush()

    l1_d = LedgerEntry(transaction_id=tx1.id, wallet_id=r_wallet.id, entry_type="DEBIT", amount_paise=tx1_amt, account_category="PAYMENT_DEBIT", description="Canteen lunch payment")
    l1_c1 = LedgerEntry(transaction_id=tx1.id, wallet_id=canteen_wallet.id, entry_type="CREDIT", amount_paise=tx1_amt, account_category="PAYMENT_CREDIT", description="Settlement from Rahul")
    l1_c2 = LedgerEntry(transaction_id=tx1.id, wallet_id=r_wallet.id, entry_type="CREDIT", amount_paise=tx1_cb, account_category="CASHBACK_CREDIT", description="BASIC tier 2% cashback")
    db.add_all([l1_d, l1_c1, l1_c2])

    # Sample TX 2: Priya (PRIME) pays Transit Shuttle ₹150
    p_user, p_wallet = student_wallets[1]
    tx2_amt = 15000  # ₹150
    tx2_cb = 675     # 3% * 1.5 = 4.5% -> 675 paise (₹6.75)
    p_wallet.balance_paise -= (tx2_amt - tx2_cb)
    shuttle_wallet.balance_paise += tx2_amt

    tx2 = Transaction(
        idempotency_key="SEED-TX-PRIYA-TRANSIT-002",
        student_wallet_id=p_wallet.id,
        merchant_wallet_id=shuttle_wallet.id,
        merchant_id=shuttle.id,
        category="TRANSPORT",
        amount_paise=tx2_amt,
        raw_cashback_paise=tx2_cb,
        actual_cashback_paise=tx2_cb,
        month_key=month_key,
        status="SUCCESS",
        description="Monthly Campus Shuttle Pass Transit Fare",
    )
    db.add(tx2)
    await db.flush()

    l2_d = LedgerEntry(transaction_id=tx2.id, wallet_id=p_wallet.id, entry_type="DEBIT", amount_paise=tx2_amt, account_category="PAYMENT_DEBIT", description="Transit shuttle fare")
    l2_c1 = LedgerEntry(transaction_id=tx2.id, wallet_id=shuttle_wallet.id, entry_type="CREDIT", amount_paise=tx2_amt, account_category="PAYMENT_CREDIT", description="Settlement from Priya")
    l2_c2 = LedgerEntry(transaction_id=tx2.id, wallet_id=p_wallet.id, entry_type="CREDIT", amount_paise=tx2_cb, account_category="CASHBACK_CREDIT", description="PRIME tier 4.5% cashback")
    db.add_all([l2_d, l2_c1, l2_c2])

    # Seed initial top-up ledger entries so wallet balance matches ledger exactly
    topup_tx = Transaction(
        idempotency_key="SEED-INITIAL-LEDGER-BALANCE",
        student_wallet_id=None,
        merchant_wallet_id=None,
        merchant_id=None,
        category="TOP_UP",
        amount_paise=0,
        raw_cashback_paise=0,
        actual_cashback_paise=0,
        month_key=month_key,
        status="SUCCESS",
        description="System initial wallet funding",
    )
    db.add(topup_tx)
    await db.flush()

    # Credit initial amounts in ledger for audit balance
    for m, m_w in merchants_list:
        base_init = m_w.balance_paise - (tx1_amt if m.id == canteen.id else (tx2_amt if m.id == shuttle.id else 0))
        db.add(LedgerEntry(transaction_id=topup_tx.id, wallet_id=m_w.id, entry_type="CREDIT", amount_paise=base_init, account_category="TOP_UP", description="Merchant initial float"))

    for _, s_w in student_wallets:
        init_amount = 150000 if s_w.id == r_wallet.id else (400000 if s_w.id == p_wallet.id else 800000)
        db.add(LedgerEntry(transaction_id=topup_tx.id, wallet_id=s_w.id, entry_type="CREDIT", amount_paise=init_amount, account_category="TOP_UP", description="Student initial load"))

    await db.commit()
    print("FinPay database seeded successfully with users, wallets, merchants, rules, and audited initial ledger.")
