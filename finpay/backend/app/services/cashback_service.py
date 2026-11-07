import math
from typing import Dict, NamedTuple


class CashbackRuleSpec(NamedTuple):
    base_rate_pct: float
    basic_monthly_cap_paise: int


# Standard rules as documented in FinPay Specification
BASE_CATEGORY_RULES: Dict[str, CashbackRuleSpec] = {
    "CANTEEN": CashbackRuleSpec(base_rate_pct=2.0, basic_monthly_cap_paise=5000),      # ₹50
    "STATIONERY": CashbackRuleSpec(base_rate_pct=1.0, basic_monthly_cap_paise=2000),   # ₹20
    "TRANSPORT": CashbackRuleSpec(base_rate_pct=3.0, basic_monthly_cap_paise=10000),   # ₹100
    "HOSTEL": CashbackRuleSpec(base_rate_pct=0.5, basic_monthly_cap_paise=20000),      # ₹200
    "ONLINE": CashbackRuleSpec(base_rate_pct=1.0, basic_monthly_cap_paise=3000),       # ₹30
    "TOP_UP": CashbackRuleSpec(base_rate_pct=0.0, basic_monthly_cap_paise=0),          # ₹0 (no cashback)
}

TIER_RATE_MULTIPLIERS: Dict[str, float] = {
    "BASIC": 1.0,
    "PRIME": 1.5,
    "PREMIUM": 2.0,
}

TIER_CAP_MULTIPLIERS: Dict[str, float] = {
    "BASIC": 1.0,
    "PRIME": 1.5,
    "PREMIUM": 2.0,
}


class CashbackBreakdown(NamedTuple):
    amount_paise: int
    category: str
    tier: str
    base_rate_pct: float
    rate_multiplier: float
    effective_rate_pct: float
    raw_cashback_paise: int
    effective_monthly_cap_paise: int


def get_tier_rate_multiplier(tier: str) -> float:
    return TIER_RATE_MULTIPLIERS.get(tier.upper(), 1.0)


def get_tier_cap_multiplier(tier: str) -> float:
    return TIER_CAP_MULTIPLIERS.get(tier.upper(), 1.0)


def get_effective_monthly_cap(category: str, tier: str) -> int:
    rule = BASE_CATEGORY_RULES.get(category.upper())
    if not rule or rule.basic_monthly_cap_paise <= 0:
        return 0
    cap_mult = get_tier_cap_multiplier(tier)
    return int(math.floor(rule.basic_monthly_cap_paise * cap_mult))


def calculate_cashback(amount_paise: int, category: str, tier: str) -> CashbackBreakdown:
    """
    Pure functional calculation of raw cashback for an individual transaction.
    Uses strictly integer paise and math.floor (never floating round).
    No database operations or network calls are performed here.
    """
    if amount_paise <= 0:
        return CashbackBreakdown(
            amount_paise=0,
            category=category,
            tier=tier,
            base_rate_pct=0.0,
            rate_multiplier=1.0,
            effective_rate_pct=0.0,
            raw_cashback_paise=0,
            effective_monthly_cap_paise=0,
        )

    rule = BASE_CATEGORY_RULES.get(category.upper())
    if not rule or rule.base_rate_pct <= 0:
        effective_cap = get_effective_monthly_cap(category, tier)
        return CashbackBreakdown(
            amount_paise=amount_paise,
            category=category,
            tier=tier,
            base_rate_pct=0.0,
            rate_multiplier=get_tier_rate_multiplier(tier),
            effective_rate_pct=0.0,
            raw_cashback_paise=0,
            effective_monthly_cap_paise=effective_cap,
        )

    rate_mult = get_tier_rate_multiplier(tier)
    effective_rate_pct = rule.base_rate_pct * rate_mult
    raw_paise = int(math.floor((amount_paise * effective_rate_pct) / 100.0))
    effective_cap = get_effective_monthly_cap(category, tier)

    return CashbackBreakdown(
        amount_paise=amount_paise,
        category=category,
        tier=tier,
        base_rate_pct=rule.base_rate_pct,
        rate_multiplier=rate_mult,
        effective_rate_pct=effective_rate_pct,
        raw_cashback_paise=raw_paise,
        effective_monthly_cap_paise=effective_cap,
    )


def clamp_cashback_to_cap(
    raw_cashback_paise: int,
    effective_monthly_cap_paise: int,
    current_month_accumulated_paise: int,
) -> int:
    """
    Clamps the raw cashback so the student's category earnings do not exceed the monthly cap.
    """
    if effective_monthly_cap_paise <= 0:
        return 0

    remaining_cap = max(0, effective_monthly_cap_paise - current_month_accumulated_paise)
    return min(raw_cashback_paise, remaining_cap)
