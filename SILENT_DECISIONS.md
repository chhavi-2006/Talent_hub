# TalentHub — Silent Decisions Documentation

This document records all **silent decisions** within the TalentHub Campus Placement Portal. 

A **silent decision** is an implicit choice, unwritten business rule, or architectural shortcut embedded directly into the codebase that is not documented in the project specifications or [README.md](file:///home/janaki/talenthub-placement-portal/README.md).

---

## 1. Placement Workflow & Business Rules

| # | Feature Area | What You Would Expect | Silent Reality (What Code Does) | Code Location | Real-World Impact |
|---|---|---|---|---|---|
| **1.1** | **Offer Acceptance** | Once a student accepts an offer, they are marked "Placed" and cannot accept further offers. | Students can hold and accept **unlimited offers simultaneously**. Accepting one does not withdraw other applications. | [`PlacementService.respond_to_offer()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L93-L105) | Students can hoard offers from multiple companies, blocking peers from getting hired. |
| **1.2** | **Hiring Funnel Integrity** | Direct pipeline: Applied $\rightarrow$ Shortlisted $\rightarrow$ Interview $\rightarrow$ Pass $\rightarrow$ Offer. | Pipeline is enforced **only in the UI**. The backend service allows issuing offers without any interview or even if the interview was marked `FAIL`. | [`PlacementService.issue_offer()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L76-L90) | Any API call can bypass interviews and issue offers directly to unvetted or rejected candidates. |
| **1.3** | **Interview Rounds** | Multi-round interviews (e.g., Technical Round 1, Round 2, HR Round) with interview history. | **Only 1 interview is allowed** per application. Rescheduling an interview overwrites previous dates and notes destructively. | [`models.py` (L73)](file:///home/janaki/talenthub-placement-portal/backend/app/models/models.py#L73), [`PlacementService.schedule_interview()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L50-L59) | No interview history is preserved; multi-stage interview workflows are structurally impossible. |
| **1.4** | **Branch Eligibility** | Core companies can restrict jobs to specific engineering disciplines (e.g., CS/IT vs. Mechanical). | `branch` is stored on students, but **completely ignored** by the eligibility checker. All jobs are open to all branches. | [`EligibilityService.verify_eligibility()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/eligibility_service.py#L6-L12) | Students from irrelevant academic branches are marked eligible for specialized technical roles. |
| **1.5** | **Offer Compensation** | Offer package matches or defaults to the advertised job package. | Recruiter enters an **arbitrary package** (`package_lpa`) that has no validation or link to `job.package_lpa`. | [`CompanyDashboard.jsx` (L201)](file:///home/janaki/talenthub-placement-portal/frontend/src/pages/CompanyDashboard.jsx#L201), [`PlacementService.issue_offer()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L76-L90) | Advertised compensation can differ wildly from actual offered compensation without audit warnings. |
| **1.6** | **Listing & Application Editing** | Recruiters can edit or close job postings; students can withdraw applications. | **Neither jobs nor applications can be edited or deleted**. No `PUT`/`PATCH`/`DELETE` endpoints exist for them. | [`jobs.py`](file:///home/janaki/talenthub-placement-portal/backend/app/api/jobs.py), [`applications.py`](file:///home/janaki/talenthub-placement-portal/backend/app/api/applications.py) | Typo fixes or drive cancellations require manual database manipulation. |

---

## 2. Authentication, Authorization & Security

| # | Feature Area | What You Would Expect | Silent Reality (What Code Does) | Code Location | Real-World Impact |
|---|---|---|---|---|---|
| **2.1** | **User Validation** | Each API request checks the database to confirm the user is active, unbanned, and has their role. | The server **never checks the database** during requests. It blindly trusts the JWT payload claims for 12 hours. | [`security.py:require_role()`](file:///home/janaki/talenthub-placement-portal/backend/app/core/security.py#L48-L54), [`auth.py:me()`](file:///home/janaki/talenthub-placement-portal/backend/app/api/auth.py#L18-L24) | Deleting or suspending a user in the database does not revoke their access; their token stays valid for 12 hours. |
| **2.2** | **Secret Management** | JWT signing keys and expiration windows are loaded from environment variables (`.env`). | Secret key and 12-hour expiration are **hardcoded directly in Python source code**. | [`security.py` (L8-L10)](file:///home/janaki/talenthub-placement-portal/backend/app/core/security.py#L8-L10) | Major security vulnerability if deployed publicly without modifying source code. |
| **2.3** | **Account Enrollment** | A "Sign Up" page exists for new students and company recruiters. | **No signup endpoint exists**. Accounts must be seeded automatically on startup or created by direct DB injection. | [`auth.py`](file:///home/janaki/talenthub-placement-portal/backend/app/api/auth.py), [`seed.py`](file:///home/janaki/talenthub-placement-portal/backend/app/seed.py#L60-L70) | Portal operates strictly as a closed walled garden; self-service registration is impossible. |
| **2.4** | **CORS Configuration** | Access is restricted to specific trusted frontend domains in production. | Configured with `allow_origins=["*"]` and `allow_credentials=True`. | [`main.py` (L10-L16)](file:///home/janaki/talenthub-placement-portal/backend/main.py#L10-L16) | Allows cross-origin API calls from any arbitrary domain. |

---

## 3. Database & Data Architecture

| # | Feature Area | What You Would Expect | Silent Reality (What Code Does) | Code Location | Real-World Impact |
|---|---|---|---|---|---|
| **3.1** | **Foreign Key Enforcement** | Relational constraints prevent broken links (e.g., an application pointing to a non-existent student). | SQLite WAL mode is enabled, but **foreign key enforcement is never turned on** (`PRAGMA foreign_keys = ON;` is omitted). | [`database.py:init_db()`](file:///home/janaki/talenthub-placement-portal/backend/app/core/database.py#L12-L16) | Relational integrity and cascades are disabled by default in SQLite; orphaned rows can freely accumulate. |
| **3.2** | **Application Uniqueness** | Database schema prevents a student from applying twice to the same job listing. | The `Application` table has **no database-level unique constraint**. Duplicate checks rely solely on Python code. | [`models.py` (L55-L68)](file:///home/janaki/talenthub-placement-portal/backend/app/models/models.py#L55-L68), [`placement_service.py` (L23-L25)](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L23-L25) | Concurrent button clicks or parallel requests can create duplicate application records for the same job. |
| **3.3** | **User-Student Linkage** | Modifying a student's profile updates or syncs with their login identity. | `User` and `Student` have separate `email` fields with **no ORM relationship or sync mechanism**. | [`models.py` (L9-L29)](file:///home/janaki/talenthub-placement-portal/backend/app/models/models.py#L9-L29) | Updating an email in the student registry leaves the login email unchanged, creating account drift. |
| **3.4** | **Transaction Boundaries** | Multi-table mutations (e.g., schedule interview + update status) succeed or fail together atomically. | Individual repository methods call `db.commit()` internally, **splitting operations into non-atomic commits**. | [`repository.py` (L16-L19)](file:///home/janaki/talenthub-placement-portal/backend/app/repositories/repository.py#L16-L19), [`placement_service.py` (L56-L62)](file:///home/janaki/talenthub-placement-portal/backend/app/services/placement_service.py#L56-L62) | If an update fails halfway through, partial data is committed, leaving the database in an inconsistent state. |
| **3.5** | **Schema Migrations** | Schema changes are tracked and migrated via migration tools (e.g., Alembic). | Uses dynamic `create_all` and runs auto-seeding on every server startup if the user table is empty. | [`main.py` (L19-L23)](file:///home/janaki/talenthub-placement-portal/backend/main.py#L19-L23), [`seed.py`](file:///home/janaki/talenthub-placement-portal/backend/app/seed.py#L10-L14) | Any change to model fields requires manually deleting `talenthub.db` and restarting the server. |

---

## 4. Frontend & User Experience

| # | Feature Area | What You Would Expect | Silent Reality (What Code Does) | Code Location | Real-World Impact |
|---|---|---|---|---|---|
| **4.1** | **Routing & Navigation** | URLs change per view (e.g., `/dashboard`, `/jobs`) allowing bookmarks and browser Back/Forward. | **No router library exists**. The entire app switches views using React state conditional checks on `user.role`. | [`App.jsx` (L28-L41)](file:///home/janaki/talenthub-placement-portal/frontend/src/App.jsx#L28-L41) | Deep-linking, bookmarking views, and browser Back/Forward navigation are completely unsupported. |
| **4.2** | **User Name Display** | Header displays the formal profile name (e.g., "Rahul Sharma" or "ABC Technologies"). | Name is generated by **splitting the email prefix** (`email.split("@")[0]`). | [`auth_service.py:login()`](file:///home/janaki/talenthub-placement-portal/backend/app/services/auth_service.py#L22), [`Header.jsx` (L15)](file:///home/janaki/talenthub-placement-portal/frontend/src/components/Header.jsx#L15) | Users see raw handles like `rahul` or `hr` instead of official registered names. |
| **4.3** | **Session Expiry Handling** | When the 12-hour token expires, the user is automatically logged out and redirected to login. | Axios has request interceptors to send tokens, but **no response interceptor for HTTP 401**. | [`api.js` (L7-L13)](file:///home/janaki/talenthub-placement-portal/frontend/src/api.js#L7-L13) | Expired sessions fail silently in console; dashboard stays visible in a broken state until manual logout. |
| **4.4** | **Data Pagination** | Large lists of jobs, students, and applications load page-by-page. | All dashboards execute **unbounded full-table queries** in single payloads. | [`StudentDashboard.jsx` (L12-L21)](file:///home/janaki/talenthub-placement-portal/frontend/src/pages/StudentDashboard.jsx#L12-L21), [`CoordinatorDashboard.jsx` (L10-L17)](file:///home/janaki/talenthub-placement-portal/frontend/src/pages/CoordinatorDashboard.jsx#L10-L17) | Fine for 5 demo rows, but performance degrades severely with real college batch sizes (1,000+ students). |
| **4.5** | **Placement Rate Metric** | Placement percentage reflects the ratio of eligible students with confirmed jobs. | Strictly calculated as: `(unique students with status == 'ACCEPTED') / total_students * 100`. | [`coordinator.py:stats()`](file:///home/janaki/talenthub-placement-portal/backend/app/api/coordinator.py#L22-L23) | Students with pending offers (`OFFERED`) or those opting out of placements do not factor into statistics. |

---

## 5. Architectural Maturity Assessment

```
                      PROTOTYPE SHORTCUTS               PRODUCTION STANDARD
               ┌───────────────────────────────┬───────────────────────────────────┐
Placement      │ Unlimited offer acceptances   │ Strict 1-offer or tiered policy   │
Workflow       │ Single-round interview limit  │ Multi-round interview workflow    │
               │ UI-only state machine         │ Backend state machine guards      │
               ├───────────────────────────────┼───────────────────────────────────┤
Security &     │ Hardcoded dev secret key      │ Environment variables (.env)      │
Auth           │ Blind 12h stateless JWTs      │ DB/Redis token validation/revocation│
               │ Closed seeded accounts only   │ Self-service registration & RBAC  │
               ├───────────────────────────────┼───────────────────────────────────┤
Database &     │ SQLite default (no FKs)       │ PostgreSQL or enforced FK PRAGMA  │
Persistence    │ Python-only uniqueness checks │ DB-level UNIQUE constraints       │
               │ Split commit transactions     │ Atomic Unit of Work / Session     │
               ├───────────────────────────────┼───────────────────────────────────┤
Frontend       │ State-based role switching    │ React Router with URL routes      │
Architecture   │ Unpaginated in-memory fetches │ Server-side pagination & filters  │
               │ No 401 session recovery       │ Axios 401 refresh/redirect logic  │
               └───────────────────────────────┴───────────────────────────────────┘
```
