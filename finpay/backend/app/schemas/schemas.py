from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# 1. Auth Schemas
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str
    wallet_id: Optional[int] = None
    wallet_tier: Optional[str] = None
    balance_paise: Optional[int] = None
    balance_inr: Optional[float] = None
    merchant_id: Optional[int] = None
    merchant_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# 2. Wallet Schemas
class CategoryLimitOut(BaseModel):
    category: str
    base_rate_pct: float
    effective_rate_pct: float
    monthly_cap_paise: int
    monthly_cap_inr: float
    used_cashback_paise: int
    used_cashback_inr: float
    remaining_cap_paise: int
    remaining_cap_inr: float
    percentage_used: float


class WalletOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    wallet_type: str
    tier: str
    balance_paise: int
    balance_inr: float
    currency: str
    limits_summary: List[CategoryLimitOut] = []


class TierUpgradeRequest(BaseModel):
    new_tier: str = Field(..., description="BASIC, PRIME, or PREMIUM")


# 3. Payment & Transaction Schemas
class PaymentRequest(BaseModel):
    merchant_id: int
    amount_paise: int = Field(..., gt=0, description="Gross charge in paise (e.g., 10000 = ₹100.00)")
    idempotency_key: str = Field(..., min_length=4, max_length=128)
    note: Optional[str] = ""


class TopUpRequest(BaseModel):
    amount_paise: int = Field(..., gt=0, description="Top-up load in paise (e.g., 50000 = ₹500.00)")
    idempotency_key: str = Field(..., min_length=4, max_length=128)


class TransactionOut(BaseModel):
    id: int
    idempotency_key: str
    category: str
    amount_paise: int
    amount_inr: float
    raw_cashback_paise: int
    raw_cashback_inr: float
    actual_cashback_paise: int
    actual_cashback_inr: float
    month_key: str
    status: str
    description: Optional[str]
    merchant_id: Optional[int] = None
    merchant_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# 4. Merchant Schemas
class MerchantOut(BaseModel):
    id: int
    business_name: str
    category: str
    location: str
    is_active: bool
    wallet_id: int
    wallet_balance_paise: int
    wallet_balance_inr: float

    class Config:
        from_attributes = True


class CreateBillRequest(BaseModel):
    amount_paise: int = Field(..., gt=0)
    customer_name: Optional[str] = ""
    order_notes: Optional[str] = ""


class BillOut(BaseModel):
    bill_id: str
    merchant_id: int
    merchant_name: str
    category: str
    amount_paise: int
    amount_inr: float
    suggested_idempotency_key: str
    created_at: datetime
