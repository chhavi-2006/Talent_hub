from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, verify_password
from app.models.models import Merchant, User, Wallet
from app.schemas.schemas import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = credentials.email.strip().lower()
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    # Fetch wallet details
    w_stmt = select(Wallet).where(Wallet.user_id == user.id)
    w_res = await db.execute(w_stmt)
    wallet = w_res.scalars().first()

    merchant_id = None
    merchant_name = None
    if user.role == "MERCHANT":
        m_stmt = select(Merchant).where(Merchant.user_id == user.id)
        m_res = await db.execute(m_stmt)
        merchant = m_res.scalars().first()
        if merchant:
            merchant_id = merchant.id
            merchant_name = merchant.business_name

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        wallet_id=wallet.id if wallet else None,
        wallet_tier=wallet.tier if wallet else None,
        balance_paise=wallet.balance_paise if wallet else None,
        balance_inr=round(wallet.balance_paise / 100.0, 2) if wallet else None,
        merchant_id=merchant_id,
        merchant_name=merchant_name,
    )


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user
