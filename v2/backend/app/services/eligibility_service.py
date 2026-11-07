from app.core.config import settings
from app.models.models import JobListing, Student


class EligibilityService:
    @staticmethod
    def verify_eligibility(student: Student, job: JobListing) -> tuple[bool, str]:
        # 1. Drive status check
        if job.status != "OPEN":
            return False, "Job application drive is currently CLOSED."

        # 2. Branch eligibility check
        if job.eligible_branches and job.eligible_branches.strip().upper() != "ALL":
            allowed = [b.strip().lower() for b in job.eligible_branches.split(",") if b.strip()]
            student_branch = student.branch.strip().lower() if student.branch else ""
            if student_branch not in allowed:
                return (
                    False,
                    f"Branch '{student.branch}' is not eligible for this role. Allowed branches: {job.eligible_branches}",
                )

        # 3. CGPA requirement check
        if student.cgpa < job.min_cgpa:
            return (
                False,
                f"CGPA ({student.cgpa:.2f}) is below minimum required CGPA ({job.min_cgpa:.2f})",
            )

        # 4. Backlog ceiling check
        if student.active_backlogs > job.max_backlogs:
            return (
                False,
                f"Active backlogs ({student.active_backlogs}) exceed maximum allowed ceiling ({job.max_backlogs})",
            )

        # 5. One-Offer & Dream Offer Policy check
        if student.placement_status == "OPTED_OUT":
            return False, "You have opted out of the campus placement process."

        if student.placement_status == "PLACED":
            # Student is already placed - check Dream Offer qualification
            min_dream_package = max(
                student.current_package_lpa * settings.DREAM_OFFER_MULTIPLIER,
                settings.DREAM_OFFER_THRESHOLD_LPA,
            )
            is_qualified_dream = job.is_dream_offer or (job.package_lpa >= min_dream_package)
            
            if not is_qualified_dream:
                return (
                    False,
                    f"Already placed at {student.current_package_lpa:.1f} LPA. Under college policy, you may only apply to Dream tier opportunities (>= {min_dream_package:.1f} LPA).",
                )

        return True, "Eligible to apply"
