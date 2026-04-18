# RM Ladies Hostel Management System

A full-stack hostel management system with biometric integration, payment tracking, and dark glassmorphism UI.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion — dark glassmorphism design
- **Backend**: Flask (Python) + SQLite
- **Auth**: JWT (Flask-JWT-Extended)
- **Biometric**: ESSL device stub (ready for SDK integration)
- **Scheduler**: APScheduler daily cron for plan expiry

## Features

- 🔐 JWT-based admin/staff login
- 👩‍🎓 Student management (CRUD, photo/ID proof upload)
- 💳 Payment recording & plan tracking (Monthly/3/6/12 months)
- 🏠 Room management with capacity tracking
- 🖐 Biometric access control (sync/override per student)
- 🕐 Daily automation: auto-expire students & disable biometric
- 📊 Dashboard with live stats & expiry alerts
- 📋 Logs & CSV export (students, payments, biometric)

## Quick Start

### With Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials

- Username: `admin`
- Password: `admin123`

> ⚠️ Change default credentials before deploying to production.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/students` | List/Create students |
| GET/PUT/DELETE | `/api/students/:id` | Student CRUD |
| GET/POST | `/api/payments` | Payment records |
| GET/POST | `/api/rooms` | Room management |
| POST | `/api/biometric/sync/:id` | Sync single student |
| POST | `/api/biometric/sync-all` | Sync all students |
| POST | `/api/biometric/override/:id` | Manual enable/disable |
| GET | `/api/biometric/logs` | Access logs |
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/export/students` | CSV export |

## Biometric Integration

The `backend/routes/biometric.py` file contains a `_sync_with_device()` stub. Replace it with your ESSL/ZKTeco SDK calls to connect to the physical device.

## Project Structure

```
├── backend/
│   ├── app.py              # Flask app factory
│   ├── models.py           # SQLAlchemy models
│   ├── extensions.py       # db, jwt instances
│   ├── scheduler.py        # APScheduler cron job
│   └── routes/
│       ├── auth.py
│       ├── students.py
│       ├── payments.py
│       ├── rooms.py
│       ├── biometric.py
│       └── reports.py
└── frontend/
    └── src/
        ├── App.jsx
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Students.jsx
            ├── StudentForm.jsx
            ├── Payments.jsx
            ├── Rooms.jsx
            ├── BiometricPanel.jsx
            └── LogsReports.jsx
```
