from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.models import Company, JobListing, Student, User

DEMO_PASSWORD = "password123"


async def seed_if_empty(db: AsyncSession):
    # Check if coordinator or users already exist
    existing = await db.execute(select(User))
    if existing.scalars().first():
        return

    # 1. Create Coordinator
    coord_user = User(
        email="coordinator@talenthub.edu",
        hashed_password=hash_password(DEMO_PASSWORD),
        role="COORDINATOR",
        is_active=True,
    )
    db.add(coord_user)
    await db.flush()

    # 2. Create Companies
    c1_user = User(
        email="hr@abctech.com",
        hashed_password=hash_password(DEMO_PASSWORD),
        role="COMPANY",
        is_active=True,
    )
    db.add(c1_user)
    await db.flush()
    c1 = Company(
        user_id=c1_user.id,
        name="ABC Technologies",
        description="Global product engineering and cloud solutions company.",
        website="https://abctech.example.com",
        is_verified=True,
    )

    c2_user = User(
        email="hr@xyzcorp.com",
        hashed_password=hash_password(DEMO_PASSWORD),
        role="COMPANY",
        is_active=True,
    )
    db.add(c2_user)
    await db.flush()
    c2 = Company(
        user_id=c2_user.id,
        name="XYZ Corp",
        description="Hardware infrastructure, semiconductors, and embedded systems.",
        website="https://xyzcorp.example.com",
        is_verified=True,
    )

    c3_user = User(
        email="recruiter@apexquant.com",
        hashed_password=hash_password(DEMO_PASSWORD),
        role="COMPANY",
        is_active=True,
    )
    db.add(c3_user)
    await db.flush()
    c3 = Company(
        user_id=c3_user.id,
        name="Apex Quant Solutions",
        description="High-frequency algorithmic trading and quantitative fintech.",
        website="https://apexquant.example.com",
        is_verified=True,
    )

    db.add_all([c1, c2, c3])
    await db.flush()

    # 3. Create Job Listings
    jobs = [
        JobListing(
            company_id=c1.id,
            role_title="Software Development Engineer",
            description="Full-stack development building scalable microservices and web apps.",
            package_lpa=9.5,
            min_cgpa=7.0,
            max_backlogs=1,
            eligible_branches="Computer Science,Information Technology",
            is_dream_offer=False,
            status="OPEN",
        ),
        JobListing(
            company_id=c1.id,
            role_title="Cloud & DevOps Engineer",
            description="Automate CI/CD pipelines and manage Kubernetes infrastructure.",
            package_lpa=8.0,
            min_cgpa=6.5,
            max_backlogs=2,
            eligible_branches="Computer Science,Information Technology,Electronics",
            is_dream_offer=False,
            status="OPEN",
        ),
        JobListing(
            company_id=c2.id,
            role_title="Embedded Firmware Engineer",
            description="Design firmware for microcontrollers, IoT devices, and RTOS platforms.",
            package_lpa=8.5,
            min_cgpa=7.5,
            max_backlogs=0,
            eligible_branches="Electronics,Electrical,Mechanical",
            is_dream_offer=False,
            status="OPEN",
        ),
        JobListing(
            company_id=c3.id,
            role_title="Quantitative Research Analyst (Dream Tier)",
            description="Build statistical arbitrage models and low-latency trading software.",
            package_lpa=24.0,
            min_cgpa=8.5,
            max_backlogs=0,
            eligible_branches="ALL",
            is_dream_offer=True,
            status="OPEN",
        ),
    ]
    db.add_all(jobs)
    await db.flush()

    # 4. Create Students
    student_specs = [
        ("Rahul Sharma", "rahul@student.talenthub.edu", "1TH22CS045", "Computer Science", 8.4, 0),
        ("Priya Nair", "priya@student.talenthub.edu", "1TH22IS023", "Information Technology", 9.2, 0),
        ("Aman Verma", "aman@student.talenthub.edu", "1TH22EC012", "Electronics", 6.8, 2),
        ("Sneha Patil", "sneha@student.talenthub.edu", "1TH22ME009", "Mechanical", 7.9, 0),
    ]

    for name, email, usn, branch, cgpa, backlogs in student_specs:
        s_user = User(
            email=email,
            hashed_password=hash_password(DEMO_PASSWORD),
            role="STUDENT",
            is_active=True,
        )
        db.add(s_user)
        await db.flush()

        s_obj = Student(
            user_id=s_user.id,
            name=name,
            usn=usn,
            branch=branch,
            cgpa=cgpa,
            active_backlogs=backlogs,
            placement_status="UNPLACED",
            current_package_lpa=0.0,
        )
        db.add(s_obj)

    await db.commit()
    print("Database seeded successfully with initial V2 data.")
