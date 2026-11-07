from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, merchants, payments, reconciliation, wallet
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.seed import seed_finpay_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed baseline accounts and rules
    async with AsyncSessionLocal() as session:
        await seed_finpay_if_empty(session)

    yield

    # Cleanup resources on shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Campus Digital Wallet & Payment Platform with Multi-Tier Cashback and Reconciliation",
    lifespan=lifespan,
)

# Robust CORS permitting all localhost development ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(wallet.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(merchants.router, prefix=API_PREFIX)
app.include_router(reconciliation.router, prefix=API_PREFIX)


@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "mode": "async-sqlite",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=settings.PORT, reload=True)
