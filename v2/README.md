# TalentHub v2 — Enterprise Campus Placement Management System

TalentHub v2 is a full-stack, production-grade campus recruitment and placement portal designed to resolve every undocumented assumption, security flaw, and business logic shortcut identified in the v1 prototype.

---

## 🎯 How Version 2 Fixes Version 1 (Silent Decisions Solved)

| Feature Dimension | Version 1 (Prototype Flaw) | Version 2 (Production Standard) |
|---|---|---|
| **Placement Policy** | Students can hold and accept unlimited offers simultaneously; no withdrawal of active applications. | **Strict One-Offer & Dream Policy**: Accepting an offer marks student `PLACED` and automatically withdraws non-dream applications. Placed students can only apply to Dream tier roles (&ge; 1.5x current CTC). |
| **Recruitment Funnel** | State machine enforced only in React UI; backend allows issuing offers without interview or on failed candidates. | **Backend State Machine Guards**: API strictly blocks offer creation unless the candidate has completed all interview rounds with a `PASS` result. |
| **Interview Model** | 1:1 single interview maximum; rescheduling destroys prior date and notes permanently. | **Multi-Round Pipeline (1:N)**: Supports Online Assessments, Technical Rounds, Managerial, and HR rounds with per-round scores, notes, and full history. |
| **Eligibility Engine** | Student `branch` is collected but ignored; all jobs are open to all branches. | **Discipline-Specific Filtering**: Jobs specify eligible branches (`Computer Science`, `Electronics`, etc.). Ineligible branches are blocked with policy messages. |
| **Authentication & Tokens** | 12-hour stateless JWT; server never verifies user in DB during requests. Hardcoded secret key in Python code. | **Secure Config & DB Validation**: Secrets loaded via `.env`; `require_role` validates user active status in DB on every request. |
| **Account Onboarding** | No signup page; closed database seeding only. | **Self-Service Registration**: Dual-role signups for Students (with USN & Branch) and Recruiter accounts. |
| **Database Integrity** | SQLite foreign keys disabled by default; no unique constraint on `(student_id, job_id)`. | **Enforced Relational Integrity**: `PRAGMA foreign_keys = ON;` on every connection; composite `UNIQUE(student_id, job_id)` constraint in schema. |
| **Frontend Architecture** | No URL routing (conditional component switching); no 401 session expiry handling. | **React Router v6**: Real URL routes (`/login`, `/register`, `/dashboard`, `/jobs`); Axios interceptor auto-redirects to login on 401 token expiry. |
| **Entity Immutability** | Jobs and applications cannot be edited or closed. | **Lifecycle Management**: Recruiters can update criteria or close job drives (`PATCH`/`DELETE` endpoints). |

---

## 🏗️ System Architecture

```
v2/
├── backend/
│   ├── app/
│   │   ├── api/          # Routers (auth, students, companies, jobs, applications, interviews, offers, coordinator)
│   │   ├── core/         # Settings (pydantic-settings), Async SQLite (with FK PRAGMA), Security (JWT + DB check)
│   │   ├── models/       # SQLAlchemy ORM models with constraints & relationships
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # PlacementService (state machine), EligibilityService (branch + dream logic)
│   │   └── seed.py       # Comprehensive initial seed data
│   ├── .env.example      # Environment variable template
│   ├── .env              # Active configuration
│   ├── requirements.txt  # Python dependencies
│   └── main.py           # FastAPI entry point with modern lifespan handler
└── frontend/
    ├── src/
    │   ├── api/          # Axios client with 401 auto-redirect interceptor
    │   ├── components/   # Navbar, StatusBadge, ProtectedRoute
    │   ├── context/      # AuthContext for session management
    │   ├── pages/        # Login, Register, StudentDashboard, CompanyDashboard, CoordinatorDashboard
    │   ├── App.jsx       # React Router route tree
    │   └── main.jsx
    ├── package.json
    └── vite.config.js    # Runs on port 5174 (alongside v1 on 5173 without conflict)
```

---

## 🚀 How to Run Version 2

### 1. Prerequisites
- **Python 3.9+**
- **Node.js v18+**

### 2. Start the Backend (Terminal 1)

```bash
cd talenthub-placement-portal/v2/backend

# Activate the virtual environment
source ../../backend/venv/bin/activate

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

* **Interactive API Documentation:** Open `http://127.0.0.1:8000/docs`
* **Health Check:** `http://127.0.0.1:8000/health`

### 3. Start the Frontend (Terminal 2)

```bash
cd talenthub-placement-portal/v2/frontend

# Install dependencies
npm install

# Start the Vite development server (port 5174)
npm run dev
```

* **Access the App:** Open `http://localhost:5174` in your browser.

---

## 👥 Demo Accounts (Seeded Automatically)

All demo accounts use the password: **`password123`**

| Role | Name | Email | Details / Branch |
|---|---|---|---|
| **Student** | Rahul Sharma | `rahul@student.talenthub.edu` | Computer Science (CGPA: 8.4) |
| **Student** | Priya Nair | `priya@student.talenthub.edu` | Information Technology (CGPA: 9.2) |
| **Student** | Sneha Patil | `sneha@student.talenthub.edu` | Mechanical (CGPA: 7.9) |
| **Company** | ABC Technologies | `hr@abctech.com` | Product Software |
| **Company** | Apex Quant Solutions | `recruiter@apexquant.com` | Dream Tier Fintech (24 LPA) |
| **Coordinator** | Placement Cell | `coordinator@talenthub.edu` | Administrative Officer |

---

## 🧪 Recommended Test Walkthrough for Professors

1. **Test Branch Eligibility Enforcement**:
   - Log in as **Sneha Patil** (`sneha@student.talenthub.edu` — Mechanical).
   - Try applying for the **Software Development Engineer** drive.
   - *Result:* The system blocks application with a clear policy notice: *"Branch 'Mechanical' is not eligible for this role. Allowed branches: Computer Science, Information Technology"*.

2. **Test Multi-Round Interview Pipeline**:
   - Log in as **Rahul Sharma** (`rahul@student.talenthub.edu` — CS) and apply for **Software Development Engineer**.
   - Log out, log in as **ABC Technologies** (`hr@abctech.com`).
   - Shortlist Rahul, then schedule **Round 1 (Online Assessment)**.
   - Note: The system will **not** allow scheduling Round 2 until Round 1 is marked `PASS`.
   - Mark Round 1 as `PASS`, then schedule **Round 2 (Technical)** and mark `PASS`.

3. **Test State Machine Offer Guard**:
   - Verify that the "Issue Offer" button only unlocks once all rounds have passed.
   - Issue an offer of **9.5 LPA**.

4. **Test One-Offer Policy & Automatic Withdrawal**:
   - Log back in as **Rahul**.
   - Apply to **Cloud & DevOps Engineer** (8.0 LPA).
   - Under My Applications, click **Accept** on the 9.5 LPA offer from ABC Tech.
   - *Result:* Rahul's status becomes `PLACED`. His pending application to Cloud & DevOps is **automatically withdrawn (`WITHDRAWN_PLACED`)** to free up the slot for other classmates.
   - Notice Rahul can now only apply to **Dream Tier** opportunities (like Apex Quant at 24 LPA).
