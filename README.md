# RM Ladies Hostel Management System

A full-stack hostel management system for RM Ladies Hostel, with a dark glassmorphism UI.

## Tech Stack

- **Frontend**: React 18 (Vite) + Tailwind CSS + Framer Motion + React Router v6
- **Backend**: Flask + Flask-JWT-Extended + SQLAlchemy (SQLite) + APScheduler

## Features

- 🔐 JWT-based admin authentication
- 👩‍🎓 Student management (add/edit/delete, plan types, active status)
- 💳 Payment tracking with automatic plan renewal
- 🏠 Room management with occupancy tracking
- 🖐 Biometric access control (ESSL device integration, mock mode)
- 📋 Entry/exit logs with CSV export
- 📊 Dashboard with charts (Recharts)
- ⏰ Daily scheduler to auto-expire students

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask API runs on `http://localhost:5000`.  
Default credentials: **admin / admin123**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The React dev server runs on `http://localhost:5173` and proxies `/api` → Flask.

## Project Structure

```
backend/
  app.py              # Flask app factory, seeds DB
  models.py           # SQLAlchemy models
  auth.py             # Login route
  scheduler.py        # APScheduler – daily expiry check
  routes/
    students.py
    payments.py
    rooms.py
    biometric.py
    logs.py
  biometric/
    essl_integration.py  # Mock ESSL device

frontend/
  src/
    pages/            # Dashboard, Students, Payments, Rooms, Biometric, Logs
    components/       # Layout, Sidebar, ProtectedRoute
    context/          # AuthContext
    api/              # Axios instance with JWT interceptor
```
