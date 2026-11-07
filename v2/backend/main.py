from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import applications, auth, companies, coordinator, interviews, jobs, offers, students
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables & seed initial data
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_if_empty(session)
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description="Enterprise-grade placement portal with multi-round interviews, branch filtering, and one-offer policy.",
)

# CORS Middleware with restricted origins from config + local dev regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(companies.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(offers.router, prefix=settings.API_V1_STR)
app.include_router(coordinator.router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health": "OK",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.VERSION}
