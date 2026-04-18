# RM Ladies Hostel Management System

A full-stack hostel management system with dark glassmorphism UI, JWT auth, biometric device integration, payment tracking, and automated student access control.

![Login Page](https://github.com/user-attachments/assets/ab6a3a47-6344-4dfb-811f-9a965f91235e)
![Dashboard](https://github.com/user-attachments/assets/b855d59a-3fc5-45d7-8ef7-9f3c8263d871)
![Students](https://github.com/user-attachments/assets/b7075821-381b-4b3f-8c5e-ec8a50eef400)
![Biometric Control](https://github.com/user-attachments/assets/ef3d7ed8-df3e-440e-94a1-efa40bba7e4a)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) + Tailwind CSS + Framer Motion |
| UI Theme | Dark glassmorphism — blur, neon glow, gradient bg |
| Backend | Flask (Python) + Flask-JWT-Extended |
| Database | SQLite via SQLAlchemy (swap to PostgreSQL easily) |
| Scheduler | APScheduler — daily expiry cron |
| Biometric | ESSL/ZKTeco middleware (mock + real SDK ready) |

---

## Features

- 🔐 **JWT Authentication** — Admin login with 24-hour tokens
- 👩‍🎓 **Student Management** — Add/edit/delete with plan type, dates, room assignment
- 💳 **Payment Tracking** — Record payments, auto-extend plan end dates, mark active
- 🏠 **Room Management** — Capacity/occupancy tracking across floors
- 🖐 **Biometric Control** — Sync/activate/deactivate fingerprint access per student
- 📋 **Access Logs** — Entry/exit logs with CSV export
- 📊 **Dashboard** — Stats cards + Recharts bar chart + recent logs
- ⏰ **Automation** — Daily cron deactivates expired students automatically
- 📱 **Responsive** — Works on mobile and desktop

---

## Project Structure

```
├── backend/
│   ├── app.py                  # Flask app factory, blueprints, DB seed
│   ├── models.py               # SQLAlchemy models
│   ├── auth.py                 # /login endpoint
│   ├── scheduler.py            # APScheduler daily expiry job
│   ├── requirements.txt
│   ├── routes/
│   │   ├── students.py         # CRUD + search/filter
│   │   ├── payments.py         # Payments + auto plan extension
│   │   ├── rooms.py            # Room CRUD
│   │   ├── biometric.py        # Sync/activate/deactivate endpoints
│   │   └── logs.py             # Entry/exit log queries
│   └── biometric/
│       └── essl_integration.py # ESSL device middleware (mock + SDK-ready)
└── frontend/
    ├── index.html
    ├── vite.config.js          # Proxy /api → Flask :5000
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── index.css           # Glassmorphism base styles
        ├── api/axios.js        # Axios + JWT interceptors
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Students.jsx
            ├── StudentForm.jsx
            ├── Payments.jsx
            ├── Rooms.jsx
            ├── BiometricPanel.jsx
            └── Logs.jsx
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Flask runs on http://localhost:5000
```

On first run the SQLite database (`hostel.db`) is created automatically with:
- Default admin user: `admin` / `admin123`
- 6 seed rooms across 2 floors

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:3000
```

Open **http://localhost:3000** and login with `admin` / `admin123`.

### 3. Environment Variables (Production)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `hostel-secret-key-2024` | **Change in production!** |
| `FLASK_DEBUG` | `false` | Set `true` for dev mode |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | `{username, password}` → `{access_token}` |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all (`?search=`, `?status=`, `?plan=`) |
| POST | `/students` | Create student |
| GET | `/students/<id>` | Get one |
| PUT | `/students/<id>` | Update |
| DELETE | `/students/<id>` | Delete |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List all (`?student_id=`) |
| POST | `/payments` | Record payment, auto-extends `end_date` |
| DELETE | `/payments/<id>` | Delete |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms` | List all |
| POST | `/rooms` | Create |
| PUT | `/rooms/<id>` | Update |
| DELETE | `/rooms/<id>` | Delete |

### Biometric
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/biometric/sync-user` | Sync student to device |
| POST | `/biometric/activate-user` | Enable fingerprint access |
| POST | `/biometric/deactivate-user` | Disable fingerprint access |
| GET | `/biometric/logs` | Device event log |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logs` | Entry/exit logs (`?student_id=`, `?type=`, `?from=`, `?to=`) |

---

## Biometric Integration

`backend/biometric/essl_integration.py` provides a mock `ESSLDevice`:

```python
device = ESSLDevice(ip="192.168.1.201", port=4370)
device.connect()
device.sync_user(student)
device.activate_user(user_id)
device.deactivate_user(user_id)
device.get_logs()
```

Replace the mock implementation with `pyzk` (ZKTeco) or the official ESSL SDK when deploying with real hardware. Set `BIOMETRIC_IP` and `BIOMETRIC_PORT` env vars.

---

## Automation

A daily APScheduler job runs at midnight:
1. Finds students where `end_date < today` and `is_active = True`
2. Sets `is_active = False`
3. Logs a deactivation event

Extend this to call `ESSLDevice.deactivate_user()` for automatic hardware lockout.

---

## Database Schema

```
Student    id, name, phone, room_number, plan_type, start_date, end_date, is_active, photo_url, id_proof_url
Payment    id, student_id (FK), amount, payment_date, duration, plan_type, notes
Room       id, room_number, capacity, occupied, floor, description
Log        id, student_id (FK), timestamp, log_type (entry/exit), device_id, method
AdminUser  id, username, password_hash
```

---

## Production Deployment

```bash
# Backend with gunicorn
pip install gunicorn
export JWT_SECRET_KEY="your-strong-secret-here"
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Frontend build
npm run build
# Serve dist/ with nginx
```

### Switch to PostgreSQL
```python
# In app.py, change:
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:pass@host/hosteldb"
```
