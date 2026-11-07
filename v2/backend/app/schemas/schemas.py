from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------- Auth Schemas ----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class StudentRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    usn: str = Field(min_length=3)
    branch: str = Field(min_length=2)  # e.g., "Computer Science"
    cgpa: float = Field(ge=0.0, le=10.0)
    active_backlogs: int = Field(ge=0)


class CompanyRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    description: str = ""
    website: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    entity_id: Optional[int] = None
    placement_status: Optional[str] = None
    current_package_lpa: Optional[float] = None


# ---------------- Student Schemas ----------------
class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str
    email: str
    usn: str
    branch: str
    cgpa: float
    active_backlogs: int
    placement_status: str
    current_package_lpa: float


# ---------------- Company Schemas ----------------
class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str
    email: str
    description: str
    website: str
    is_verified: bool


# ---------------- Job Schemas ----------------
class JobCreate(BaseModel):
    role_title: str
    description: str = ""
    package_lpa: float = Field(gt=0.0)
    min_cgpa: float = Field(ge=0.0, le=10.0, default=0.0)
    max_backlogs: int = Field(ge=0, default=0)
    eligible_branches: str = "ALL"  # "ALL" or comma-separated e.g. "Computer Science,Information Technology"
    is_dream_offer: bool = False


class JobUpdate(BaseModel):
    role_title: Optional[str] = None
    description: Optional[str] = None
    package_lpa: Optional[float] = None
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    eligible_branches: Optional[str] = None
    is_dream_offer: Optional[bool] = None
    status: Optional[str] = None  # OPEN or CLOSED


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    company_name: Optional[str] = None
    role_title: str
    description: str
    package_lpa: float
    min_cgpa: float
    max_backlogs: int
    eligible_branches: str
    is_dream_offer: bool
    status: str
    created_at: datetime
    eligible: Optional[bool] = None
    eligibility_reason: Optional[str] = None


# ---------------- Interview Schemas ----------------
class InterviewRoundCreate(BaseModel):
    application_id: int
    round_number: int = Field(ge=1, default=1)
    round_type: str = "TECHNICAL"  # ONLINE_ASSESSMENT, TECHNICAL, MANAGERIAL, HR
    scheduled_at: datetime


class InterviewRoundResult(BaseModel):
    result: str  # PASS or FAIL
    feedback: str = ""
    score: Optional[float] = None


class InterviewRoundOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    application_id: int
    round_number: int
    round_type: str
    scheduled_at: datetime
    status: str
    result: str
    feedback: str
    score: Optional[float] = None


# ---------------- Offer Schemas ----------------
class OfferCreate(BaseModel):
    application_id: int
    package_lpa: Optional[float] = None  # Defaults to job.package_lpa if not specified


class OfferRespond(BaseModel):
    accept: bool


class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    application_id: int
    package_lpa: float
    status: str
    issued_at: datetime
    responded_at: Optional[datetime] = None


# ---------------- Application Schemas ----------------
class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationStatusUpdate(BaseModel):
    status: str  # SHORTLISTED, REJECTED


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    job_id: int
    status: str
    applied_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    student_usn: Optional[str] = None
    student_branch: Optional[str] = None
    student_cgpa: Optional[float] = None
    student_backlogs: Optional[int] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    package_lpa: Optional[float] = None
    is_dream_offer: Optional[bool] = None
    interview_rounds: List[InterviewRoundOut] = []
    offer: Optional[OfferOut] = None


# ---------------- Coordinator Stats Schemas ----------------
class CoordinatorStats(BaseModel):
    total_students: int
    placed_students: int
    unplaced_students: int
    total_companies: int
    total_jobs: int
    active_jobs: int
    total_applications: int
    offers_issued: int
    offers_accepted: int
    placement_percentage: float
    avg_package_lpa: float
    highest_package_lpa: float
