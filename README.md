# TalentHub Campus Placement Management System (v2)

TalentHub is a full-stack web application that manages the college placement process end-to-end:
students apply for jobs, companies shortlist eligible students, interviews get scheduled and
recorded, offers are issued and accepted, and the placement coordinator tracks placement statistics.

Built with a layered architecture:

```
backend/
  app/
    api/          # Router layer (FastAPI routers)
    core/         # Database config, JWT auth / security
    models/       # SQLAlchemy models (Student, Company, JobListing, Application, Interview, Offer, User)
    repositories/ # Data-access layer
    services/     # Business logic (eligibility rules, placement workflow, auth)
    schemas/      # Pydantic request/response schemas
  main.py         # FastAPI entry point (seeds demo data on first run)
  requirements.txt
frontend/
  src/
    pages/        # Login, StudentDashboard, CompanyDashboard, CoordinatorDashboard
    components/    # Header, StatusBadge
    api.js         # Axios client with JWT auth
  package.json
```

## Run the backend (FastAPI + SQLite)

```bash
cd "D:\Gemini\Talenthub v2\backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Run the frontend (React + Vite + Tailwind)

```bash
cd "D:\Gemini\Talenthub v2\frontend"
npm install
npm run dev
```

App: http://localhost:5173

## Demo accounts (seeded automatically on first backend start)

All demo accounts use the password `password123`.

| Role        | Email                          |
|-------------|---------------------------------|
| Student     | rahul@student.talenthub.edu     |
| Student     | priya@student.talenthub.edu     |
| Student     | aman@student.talenthub.edu      |
| Company     | hr@abctech.com                  |
| Company     | hr@xyzcorp.com                  |
| Coordinator | coordinator@talenthub.edu       |

## Workflow

1. **Student** logs in, views eligible job listings (eligibility checked against CGPA / backlog
   criteria), and applies.
2. **Company** logs in, posts job listings, views applicants, shortlists/rejects, schedules
   interviews, records pass/fail results, and issues offers to students who passed.
3. **Student** accepts or declines the offer.
4. **Coordinator** logs in to view placement statistics (students placed, offers issued,
   placement %) and a full table of all applications across the system.
