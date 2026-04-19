from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="staff")  # admin | staff
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Room(db.Model):
    __tablename__ = "rooms"
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(20), unique=True, nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=1)
    occupied = db.Column(db.Integer, nullable=False, default=0)
    floor = db.Column(db.String(20))
    students = db.relationship("Student", backref="room", lazy=True)

    @property
    def is_full(self):
        return self.occupied >= self.capacity

    def to_dict(self):
        return {
            "id": self.id,
            "room_number": self.room_number,
            "capacity": self.capacity,
            "occupied": self.occupied,
            "floor": self.floor,
            "vacant": self.capacity - self.occupied,
        }


class Student(db.Model):
    __tablename__ = "students"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    parent_contact_no = db.Column(db.String(20))
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"))
    plan_type = db.Column(db.String(20))  # monthly|3months|6months|12months
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    payment_status = db.Column(db.String(20), default="pending")  # active|expired|pending
    biometric_enabled = db.Column(db.Boolean, default=False)
    biometric_id = db.Column(db.String(50))  # fingerprint ID on ESSL device
    essl_uid = db.Column(db.Integer)  # numeric UID used on the ZKTeco device
    id_proof_path = db.Column(db.String(256))
    photo_path = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payments = db.relationship("Payment", backref="student", lazy=True, cascade="all, delete-orphan")
    bio_logs = db.relationship("BiometricLog", backref="student", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "parent_contact_no": self.parent_contact_no,
            "room_id": self.room_id,
            "room_number": self.room.room_number if self.room else None,
            "plan_type": self.plan_type,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "payment_status": self.payment_status,
            "biometric_enabled": self.biometric_enabled,
            "biometric_id": self.biometric_id,
            "essl_uid": self.essl_uid,
            "id_proof_path": self.id_proof_path,
            "photo_path": self.photo_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Payment(db.Model):
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    plan_type = db.Column(db.String(20))
    paid_date = db.Column(db.Date, default=datetime.utcnow)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "amount": self.amount,
            "plan_type": self.plan_type,
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BiometricLog(db.Model):
    __tablename__ = "biometric_logs"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"))
    event_type = db.Column(db.String(20))  # entry|exit|sync|denied
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    device_id = db.Column(db.String(50))
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else "Unknown",
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "device_id": self.device_id,
            "notes": self.notes,
        }


class DeviceConfig(db.Model):
    __tablename__ = "device_config"
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50), nullable=False, default="192.168.1.201")
    port = db.Column(db.Integer, nullable=False, default=4370)
    status = db.Column(db.String(20), default="unknown")  # connected | disconnected | unknown
    last_sync = db.Column(db.DateTime)
    device_serial = db.Column(db.String(100))
    firmware_version = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "ip_address": self.ip_address,
            "port": self.port,
            "status": self.status,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "device_serial": self.device_serial,
            "firmware_version": self.firmware_version,
        }
