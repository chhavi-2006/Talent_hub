"""
Export utility — generates a CSV report of all placed students for a given
academic year. Used by the Coordinator to share placement statistics with
the university administration.

Added by: chhavi-2006
"""

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_session
from app.models.models import Application, JobListing, Offer, Student, User

router = APIRouter(prefix="/coordinator", tags=["coordinator-exports"])


def _require_coordinator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "COORDINATOR":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Coordinator access required.")
    return current_user


@router.get(
    "/export/placed-students",
    summary="Export placed students as CSV",
    response_class=StreamingResponse,
)
async def export_placed_students_csv(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(_require_coordinator),
):
    """
    Streams a UTF-8 CSV of every PLACED student including their name, USN,
    branch, CGPA, company, role, and accepted package.  Useful for annual
    placement reports submitted to the university administration.
    """
    # Fetch all accepted offers with related student + job info
    stmt = (
        select(Student, JobListing, Offer)
        .join(Application, Application.student_id == Student.id)
        .join(Offer, Offer.application_id == Application.id)
        .join(JobListing, JobListing.id == Application.job_id)
        .where(
            Offer.status == "ACCEPTED",
            Student.placement_status == "PLACED",
        )
        .order_by(Student.name)
    )

    result = await session.execute(stmt)
    rows = result.all()

    # Build CSV in-memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Student Name",
        "USN",
        "Branch",
        "CGPA",
        "Active Backlogs",
        "Company",
        "Role",
        "Package (LPA)",
        "Offer Accepted At",
    ])

    for student, job, offer in rows:
        writer.writerow([
            student.name,
            student.usn,
            student.branch,
            f"{student.cgpa:.2f}",
            student.active_backlogs,
            job.company.name if job.company else "N/A",
            job.role_title,
            f"{offer.package_lpa:.2f}",
            offer.responded_at.strftime("%Y-%m-%d %H:%M UTC") if offer.responded_at else "N/A",
        ])

    output.seek(0)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"placed_students_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/export/summary",
    summary="Placement summary statistics as JSON",
)
async def export_placement_summary(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(_require_coordinator),
):
    """
    Returns aggregate placement statistics: total students, placed count,
    placement percentage, average package, highest package, branch-wise breakdown.
    """
    stmt = select(Student)
    result = await session.execute(stmt)
    all_students = result.scalars().all()

    placed = [s for s in all_students if s.placement_status == "PLACED"]
    packages = [s.current_package_lpa for s in placed if s.current_package_lpa > 0]

    # Branch-wise breakdown
    branch_stats: dict = {}
    for s in all_students:
        b = s.branch
        if b not in branch_stats:
            branch_stats[b] = {"total": 0, "placed": 0}
        branch_stats[b]["total"] += 1
        if s.placement_status == "PLACED":
            branch_stats[b]["placed"] += 1

    for b in branch_stats:
        total = branch_stats[b]["total"]
        p = branch_stats[b]["placed"]
        branch_stats[b]["placement_pct"] = round((p / total * 100), 1) if total else 0.0

    return {
        "total_students": len(all_students),
        "placed_count": len(placed),
        "unplaced_count": len(all_students) - len(placed),
        "placement_percentage": round(len(placed) / len(all_students) * 100, 1) if all_students else 0.0,
        "average_package_lpa": round(sum(packages) / len(packages), 2) if packages else 0.0,
        "highest_package_lpa": max(packages, default=0.0),
        "lowest_package_lpa": min(packages, default=0.0),
        "branch_breakdown": branch_stats,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
