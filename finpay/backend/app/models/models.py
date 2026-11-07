from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="STUDENT")  # STUDENT, MERCHANT, AUDITOR
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    merchant_profile = relationship("Merchant", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    wallet_type = Column(String(50), nullable=False, default="STUDENT")  # STUDENT, MERCHANT, SYSTEM
    tier = Column(String(50), nullable=False, default="BASIC")  # BASIC, PRIME, PREMIUM
    balance_paise = Column(Integer, nullable=False, default=0)
    currency = Column(String(10), default="INR", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="wallet")
    merchant = relationship("Merchant", back_populates="wallet", uselist=False)
    ledger_entries = relationship("LedgerEntry", back_populates="wallet")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="RESTRICT"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # CANTEEN, STATIONERY, TRANSPORT, HOSTEL, ONLINE, TOP_UP
    location = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="merchant_profile")
    wallet = relationship("Wallet", back_populates="merchant")
    transactions = relationship("Transaction", back_populates="merchant")


class CashbackRule(Base):
    __tablename__ = "cashback_rules"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), unique=True, nullable=False, index=True)
    base_rate_pct = Column(Float, nullable=False)  # 2.0 = 2%
    basic_monthly_cap_paise = Column(Integer, nullable=False)  # e.g., 5000 = ₹50
    description = Column(String(255), nullable=True)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    student_wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=True, index=True)
    merchant_wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="RESTRICT"), nullable=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    raw_cashback_paise = Column(Integer, nullable=False, default=0)
    actual_cashback_paise = Column(Integer, nullable=False, default=0)
    month_key = Column(String(7), nullable=False, index=True)  # "YYYY-MM"
    status = Column(String(50), nullable=False, default="SUCCESS")  # SUCCESS, FAILED
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    merchant = relationship("Merchant", back_populates="transactions")
    ledger_entries = relationship("LedgerEntry", back_populates="transaction", cascade="all, delete-orphan")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_type = Column(String(20), nullable=False)  # DEBIT, CREDIT
    amount_paise = Column(Integer, nullable=False)
    account_category = Column(String(50), nullable=False)  # PAYMENT_DEBIT, PAYMENT_CREDIT, CASHBACK_CREDIT, TOP_UP
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="ledger_entries")
    wallet = relationship("Wallet", back_populates="ledger_entries")


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, COMPLETED, FAILED
    response_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
