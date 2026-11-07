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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # STUDENT, COMPANY, COORDINATOR
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # 1:1 relationships with cascade delete
    student = relationship(
        "Student", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    company = relationship(
        "Company", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name = Column(String(150), nullable=False)
    usn = Column(String(50), unique=True, index=True, nullable=False)
    branch = Column(String(100), nullable=False)  # e.g., "Computer Science", "Information Technology", "Electronics"
    cgpa = Column(Float, nullable=False, default=0.0)
    active_backlogs = Column(Integer, nullable=False, default=0)
    
    # Placement status tracking for One-Offer policy
    placement_status = Column(
        String(50), default="UNPLACED", nullable=False
    )  # UNPLACED, PLACED, OPTED_OUT
    current_package_lpa = Column(Float, default=0.0, nullable=False)

    user = relationship("User", back_populates="student")
    applications = relationship(
        "Application", back_populates="student", cascade="all, delete-orphan"
    )


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name = Column(String(150), nullable=False)
    description = Column(Text, default="")
    website = Column(String(255), default="")
    is_verified = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="company")
    jobs = relationship(
        "JobListing", back_populates="company", cascade="all, delete-orphan"
    )


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    role_title = Column(String(150), nullable=False)
    description = Column(Text, default="")
    package_lpa = Column(Float, nullable=False, default=0.0)
    min_cgpa = Column(Float, nullable=False, default=0.0)
    max_backlogs = Column(Integer, nullable=False, default=0)
    
    # Branch eligibility criteria: comma-separated branch names or "ALL"
    eligible_branches = Column(
        String(500), default="ALL", nullable=False
    )
    
    # Dream offer tier flag
    is_dream_offer = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, CLOSED
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    company = relationship("Company", back_populates="jobs")
    applications = relationship(
        "Application", back_populates="job", cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    job_id = Column(
        Integer, ForeignKey("job_listings.id", ondelete="CASCADE"), nullable=False
    )
    
    # State Machine: APPLIED -> SHORTLISTED -> INTERVIEWING -> INTERVIEW_PASSED -> OFFERED -> ACCEPTED / DECLINED / REJECTED / WITHDRAWN_PLACED
    status = Column(String(50), default="APPLIED", nullable=False)
    applied_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("student_id", "job_id", name="uq_student_job"),
    )

    student = relationship("Student", back_populates="applications")
    job = relationship("JobListing", back_populates="applications")
    interview_rounds = relationship(
        "InterviewRound",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="InterviewRound.round_number",
    )
    offer = relationship(
        "Offer",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
    )


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    round_number = Column(Integer, nullable=False, default=1)
    round_type = Column(
        String(50), nullable=False, default="TECHNICAL"
    )  # ONLINE_ASSESSMENT, TECHNICAL, MANAGERIAL, HR
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        String(50), default="SCHEDULED", nullable=False
    )  # SCHEDULED, COMPLETED, CANCELLED
    result = Column(
        String(50), default="PENDING", nullable=False
    )  # PENDING, PASS, FAIL
    feedback = Column(Text, default="")
    score = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("application_id", "round_number", name="uq_app_round"),
    )

    application = relationship("Application", back_populates="interview_rounds")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    package_lpa = Column(Float, nullable=False)
    status = Column(
        String(50), default="ISSUED", nullable=False
    )  # ISSUED, ACCEPTED, DECLINED
    issued_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="offer")
