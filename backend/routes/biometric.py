from datetime import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models import Student, BiometricLog, DeviceConfig
import biometric_service as bs

biometric_bp = Blueprint("biometric", __name__)

def admin_required(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin privilege required"}), 403
        return fn(*args, **kwargs)
    return decorator


# ── Helpers ─────────────────────────────────────────────────────────────────

def _get_device_cfg():
    """Return the single DeviceConfig row, creating default if none exists."""
    cfg = DeviceConfig.query.first()
    if not cfg:
        cfg = DeviceConfig(ip_address="192.168.1.201", port=4370, status="unknown")
        db.session.add(cfg)
        db.session.commit()
    return cfg


def _log(student_id, event_type, notes, device_id=None):
    log = BiometricLog(
        student_id=student_id,
        event_type=event_type,
        device_id=device_id,
        notes=notes,
    )
    db.session.add(log)


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _upsert_student_from_device(uid=None, user_id=None, name=None):
    """Find or create student using device identifiers."""
    uid_int = _safe_int(uid)
    user_id_int = _safe_int(user_id)

    student = None
    if uid_int is not None:
        student = Student.query.filter_by(essl_uid=uid_int).first()
    if not student and user_id_int is not None:
        student = Student.query.filter_by(id=user_id_int).first()

    if student:
        if student.essl_uid is None and uid_int is not None:
            student.essl_uid = uid_int
        # Keep existing biometric_enabled value. Do not overwrite to True.
        if student.biometric_enabled is None:
            student.biometric_enabled = True
        if not student.biometric_id and uid_int is not None:
            student.biometric_id = str(uid_int)
        return student, False

    label = name or f"Device User {uid_int if uid_int is not None else (user_id if user_id is not None else 'unknown')}"
    student = Student(
        name=label,
        email=(f"user{uid_int}@device.local" if uid_int is not None else None),
        phone=(f"000000{uid_int:04d}" if uid_int is not None else None),
        payment_status="active",
        essl_uid=uid_int,
        biometric_enabled=True,
        biometric_id=(str(uid_int) if uid_int is not None else None),
    )
    db.session.add(student)
    db.session.flush()
    return student, True


# ── Device Config endpoints ──────────────────────────────────────────────────

@biometric_bp.route("/device", methods=["GET"])
@jwt_required()
def get_device_config():
    cfg = _get_device_cfg()
    return jsonify(cfg.to_dict()), 200


@biometric_bp.route("/device", methods=["PUT"])
@jwt_required()
@admin_required
def update_device_config():
    data = request.get_json() or {}
    cfg = _get_device_cfg()
    if data.get("ip_address"):
        cfg.ip_address = data["ip_address"]
    if data.get("port"):
        cfg.port = int(data["port"])
    cfg.status = "unknown"
    db.session.commit()
    return jsonify(cfg.to_dict()), 200


@biometric_bp.route("/device/test", methods=["POST"])
@jwt_required()
def test_device_connection():
    """Test connectivity and fetch device info."""
    data = request.get_json() or {}
    cfg = _get_device_cfg()
    ip = data.get("ip_address", cfg.ip_address)
    port = int(data.get("port", cfg.port))

    success, info = bs.test_connection(ip, port)
    if success:
        cfg.ip_address = ip
        cfg.port = port
        cfg.status = "connected"
        cfg.device_serial = info.get("serial_number")
        cfg.firmware_version = info.get("firmware_version")
    else:
        cfg.status = "disconnected"
    db.session.commit()

    return jsonify({
        "success": success,
        "status": cfg.status,
        "info": info if success else None,
        "error": None if success else info,
    }), 200 if success else 503


@biometric_bp.route("/device/restart", methods=["POST"])
@jwt_required()
@admin_required
def restart_device():
    cfg = _get_device_cfg()
    success, msg = bs.restart_device(cfg.ip_address, cfg.port)
    if success:
        cfg.status = "disconnected"
        db.session.commit()
    return jsonify({"success": success, "message": msg}), 200


@biometric_bp.route("/device/clear", methods=["POST"])
@jwt_required()
@admin_required
def clear_device_data():
    """Clear attendance logs from device (admin only)."""
    cfg = _get_device_cfg()
    success, msg = bs.clear_device_data(cfg.ip_address, cfg.port)
    return jsonify({"success": success, "message": msg}), 200


# ── Enroll / Activate / Deactivate ──────────────────────────────────────────

@biometric_bp.route("/enroll/<int:student_id>", methods=["POST"])
@jwt_required()
def enroll_user(student_id):
    """Trigger fingerprint enrollment for a student on the ESSL device."""
    student = Student.query.get_or_404(student_id)
    cfg = _get_device_cfg()

    if not student.essl_uid:
        # Get next available UID from device
        next_uid = bs.get_next_uid(cfg.ip_address, cfg.port)
        # Ensure it does not conflict with DB
        existing_uids = {s.essl_uid for s in Student.query.filter(Student.essl_uid.isnot(None)).all()}
        while next_uid in existing_uids:
            next_uid += 1
        student.essl_uid = next_uid
        db.session.flush()

    success, msg = bs.enroll_user(
        cfg.ip_address, cfg.port,
        uid=student.essl_uid,
        user_id=str(student.id),
        name=student.name,
    )

    if success:
        student.biometric_enabled = True
        student.biometric_id = str(student.essl_uid)
        _log(student.id, "sync", f"Fingerprint enrolled: {msg}", str(cfg.ip_address))
    else:
        _log(student.id, "sync", f"Enrollment failed: {msg}", str(cfg.ip_address))

    db.session.commit()
    return jsonify({
        "success": success,
        "message": msg,
        "essl_uid": student.essl_uid,
        "biometric_enabled": student.biometric_enabled,
    }), 200


@biometric_bp.route("/activate/<int:student_id>", methods=["POST"])
@jwt_required()
def activate_user(student_id):
    """Add / re-enable a user on the device."""
    student = Student.query.get_or_404(student_id)
    cfg = _get_device_cfg()

    if not student.essl_uid:
        return jsonify({"error": "Student has no ESSL UID. Enroll fingerprint first."}), 400

    success, msg = bs.activate_user(
        cfg.ip_address, cfg.port,
        uid=student.essl_uid,
        user_id=str(student.id),
        name=student.name,
    )
    if success:
        student.biometric_enabled = True
        _log(student.id, "sync", f"Activated on device: {msg}", str(cfg.ip_address))
    db.session.commit()
    return jsonify({"success": success, "message": msg, "biometric_enabled": student.biometric_enabled}), 200


@biometric_bp.route("/deactivate/<int:student_id>", methods=["POST"])
@jwt_required()
def deactivate_user(student_id):
    """Remove a user from the device."""
    student = Student.query.get_or_404(student_id)
    cfg = _get_device_cfg()

    if not student.essl_uid:
        return jsonify({"error": "Student has no ESSL UID."}), 400

    success, msg = bs.deactivate_user(cfg.ip_address, cfg.port, uid=student.essl_uid)
    if success:
        student.biometric_enabled = False
        _log(student.id, "sync", f"Deactivated on device: {msg}", str(cfg.ip_address))
    db.session.commit()
    return jsonify({"success": success, "message": msg, "biometric_enabled": student.biometric_enabled}), 200


# ── Pull Logs from Device ────────────────────────────────────────────────────

@biometric_bp.route("/device/pull-logs", methods=["POST"])
@jwt_required()
def pull_device_logs():
    """
    Fetch attendance logs from the ESSL device and store them in DB.
    Maps device user_id → student DB id.
    """
    cfg = _get_device_cfg()
    success, data = bs.pull_attendance_logs(cfg.ip_address, cfg.port)

    if not success:
        return jsonify({"success": False, "error": data}), 503

    imported = 0
    created_students = 0
    for entry in data:
        user_id_int = _safe_int(entry.get("user_id"))
        uid_int = _safe_int(entry.get("uid"))

        student = Student.query.filter_by(id=user_id_int).first() if user_id_int is not None else None
        if not student:
            student = Student.query.filter_by(essl_uid=uid_int).first() if uid_int is not None else None
        if not student:
            student, created = _upsert_student_from_device(uid=uid_int, user_id=user_id_int)
            if created:
                created_students += 1

        # Check for duplicates before inserting
        parsed_timestamp = datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.utcnow()
        event_type = "entry" if entry.get("punch") in (0, 4) else "exit"

        existing_log = BiometricLog.query.filter(
            BiometricLog.timestamp == parsed_timestamp,
            BiometricLog.event_type == event_type,
            BiometricLog.student_id == (student.id if student else None)
        ).first()

        if existing_log:
            continue

        log = BiometricLog(
            student_id=student.id if student else None,
            event_type=event_type,
            timestamp=parsed_timestamp,
            device_id=str(cfg.ip_address),
            notes=f"Pulled from device. Status={entry.get('status')} Punch={entry.get('punch')}",
        )
        db.session.add(log)
        imported += 1

    cfg.last_sync = datetime.utcnow()
    cfg.status = "connected"
    db.session.commit()

    return jsonify({
        "success": True,
        "imported": imported,
        "created_students": created_students,
        "last_sync": cfg.last_sync.isoformat(),
    }), 200


@biometric_bp.route("/device/pull-users", methods=["POST"])
@jwt_required()
def pull_device_users():
    """Fetch users from the ESSL device and sync them into the DB."""
    cfg = _get_device_cfg()
    success, data = bs.pull_users(cfg.ip_address, cfg.port)

    if not success:
        return jsonify({"success": False, "error": data}), 503

    imported = 0
    updated = 0
    for u in data:
        student, created = _upsert_student_from_device(
            uid=u.get("uid"),
            user_id=u.get("user_id"),
            name=u.get("name"),
        )
        if created:
            imported += 1
        else:
            updated += 1

    cfg.last_sync = datetime.utcnow()
    cfg.status = "connected"
    db.session.commit()

    return jsonify({
        "success": True,
        "imported": imported,
        "updated": updated,
        "total_device_users": len(data)
    }), 200


# ── Legacy sync/override/sync-all (kept for backward compat) ─────────────────

@biometric_bp.route("/sync/<int:student_id>", methods=["POST"])
@jwt_required()
def sync_student(student_id):
    student = Student.query.get_or_404(student_id)
    enable = student.payment_status == "active"
    cfg = _get_device_cfg()

    if not student.essl_uid:
        student.biometric_enabled = False
        db.session.commit()
        return jsonify({"success": False, "message": "No ESSL UID assigned", "biometric_enabled": False}), 200

    if enable:
        success, msg = bs.activate_user(cfg.ip_address, cfg.port, student.essl_uid, str(student.id), student.name)
    else:
        success, msg = bs.deactivate_user(cfg.ip_address, cfg.port, student.essl_uid)

    if success:
        student.biometric_enabled = enable
        _log(student.id, "sync", msg, str(cfg.ip_address))
        db.session.commit()

    return jsonify({"success": success, "message": msg, "biometric_enabled": student.biometric_enabled}), 200


@biometric_bp.route("/override/<int:student_id>", methods=["POST"])
@jwt_required()
def override_access(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json() or {}
    enable = data.get("enable", False)
    cfg = _get_device_cfg()

    if not student.essl_uid:
        return jsonify({"success": False, "message": "No ESSL UID assigned"}), 400

    if enable:
        success, msg = bs.activate_user(cfg.ip_address, cfg.port, student.essl_uid, str(student.id), student.name)
    else:
        success, msg = bs.deactivate_user(cfg.ip_address, cfg.port, student.essl_uid)

    if success:
        student.biometric_enabled = enable
        _log(student.id, "sync", f"Manual override: {'enabled' if enable else 'disabled'} – {msg}")
        db.session.commit()

    return jsonify({"success": success, "message": msg, "biometric_enabled": student.biometric_enabled}), 200


@biometric_bp.route("/sync-all", methods=["POST"])
@jwt_required()
def sync_all():
    cfg = _get_device_cfg()

    # 1) Pull users from device and upsert into local DB.
    users_ok, users_data = bs.pull_users(cfg.ip_address, cfg.port)
    if not users_ok:
        cfg.status = "disconnected"
        db.session.commit()
        return jsonify({"success": False, "error": users_data}), 503

    imported = 0
    updated = 0
    for u in users_data:
        _, created = _upsert_student_from_device(
            uid=u.get("uid"),
            user_id=u.get("user_id"),
            name=u.get("name"),
        )
        if created:
            imported += 1
        else:
            updated += 1

    # 2) Pull attendance logs and store all records locally.
    logs_ok, logs_data = bs.pull_attendance_logs(cfg.ip_address, cfg.port)
    if not logs_ok:
        cfg.status = "disconnected"
        db.session.commit()
        return jsonify({
            "success": False,
            "error": logs_data,
            "imported_users": imported,
            "updated_users": updated,
        }), 503

    logs_imported = 0
    logs_created_students = 0
    for entry in logs_data:
        student, created = _upsert_student_from_device(
            uid=entry.get("uid"),
            user_id=entry.get("user_id"),
        )
        if created:
            logs_created_students += 1

        # Check for duplicates before inserting
        parsed_timestamp = datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.utcnow()
        event_type = "entry" if entry.get("punch") in (0, 4) else "exit"

        existing_log = BiometricLog.query.filter(
            BiometricLog.timestamp == parsed_timestamp,
            BiometricLog.event_type == event_type,
            BiometricLog.student_id == (student.id if student else None)
        ).first()

        if existing_log:
            continue

        log = BiometricLog(
            student_id=student.id if student else None,
            event_type=event_type,
            timestamp=parsed_timestamp,
            device_id=str(cfg.ip_address),
            notes=f"Pulled from device. Status={entry.get('status')} Punch={entry.get('punch')}",
        )
        db.session.add(log)
        logs_imported += 1

    # 3) Sync access state for all known students based on payment status.
    students = Student.query.all()
    results = []
    for student in students:
        enable = student.payment_status == "active"
        if not student.essl_uid:
            results.append({"student_id": student.id, "name": student.name, "success": False, "message": "No ESSL UID"})
            continue
        if enable:
            success, msg = bs.activate_user(cfg.ip_address, cfg.port, student.essl_uid, str(student.id), student.name)
        else:
            success, msg = bs.deactivate_user(cfg.ip_address, cfg.port, student.essl_uid)
        if success:
            student.biometric_enabled = enable
            _log(student.id, "sync", f"Batch sync: {msg}")
        results.append({"student_id": student.id, "name": student.name, "success": success, "message": msg})

    cfg.status = "connected"
    cfg.last_sync = datetime.utcnow()
    db.session.commit()
    return jsonify({
        "success": True,
        "synced": len(results),
        "results": results,
        "imported_users": imported,
        "updated_users": updated,
        "logs_imported": logs_imported,
        "logs_created_students": logs_created_students,
        "last_sync": cfg.last_sync.isoformat(),
    }), 200


@biometric_bp.route("/device/import-all", methods=["POST"])
@jwt_required()
def import_all_from_device():
    """Import all users and logs from device into DB without changing access states."""
    cfg = _get_device_cfg()

    users_ok, users_data = bs.pull_users(cfg.ip_address, cfg.port)
    if not users_ok:
        cfg.status = "disconnected"
        db.session.commit()
        return jsonify({"success": False, "error": users_data}), 503

    imported_users = 0
    updated_users = 0
    for u in users_data:
        _, created = _upsert_student_from_device(
            uid=u.get("uid"),
            user_id=u.get("user_id"),
            name=u.get("name"),
        )
        if created:
            imported_users += 1
        else:
            updated_users += 1

    logs_ok, logs_data = bs.pull_attendance_logs(cfg.ip_address, cfg.port)
    if not logs_ok:
        cfg.status = "disconnected"
        db.session.commit()
        return jsonify({
            "success": False,
            "error": logs_data,
            "imported_users": imported_users,
            "updated_users": updated_users,
        }), 503

    logs_imported = 0
    logs_created_students = 0
    for entry in logs_data:
        student, created = _upsert_student_from_device(
            uid=entry.get("uid"),
            user_id=entry.get("user_id"),
        )
        if created:
            logs_created_students += 1

        # Check for duplicates before inserting
        parsed_timestamp = datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.utcnow()
        event_type = "entry" if entry.get("punch") in (0, 4) else "exit"

        existing_log = BiometricLog.query.filter(
            BiometricLog.timestamp == parsed_timestamp,
            BiometricLog.event_type == event_type,
            BiometricLog.student_id == (student.id if student else None)
        ).first()

        if existing_log:
            continue

        log = BiometricLog(
            student_id=student.id if student else None,
            event_type=event_type,
            timestamp=parsed_timestamp,
            device_id=str(cfg.ip_address),
            notes=f"Pulled from device. Status={entry.get('status')} Punch={entry.get('punch')}",
        )
        db.session.add(log)
        logs_imported += 1

    cfg.status = "connected"
    cfg.last_sync = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "imported_users": imported_users,
        "updated_users": updated_users,
        "logs_imported": logs_imported,
        "logs_created_students": logs_created_students,
        "last_sync": cfg.last_sync.isoformat(),
    }), 200


# ── Log endpoints ────────────────────────────────────────────────────────────

@biometric_bp.route("/logs", methods=["GET"])
@jwt_required()
def get_logs():
    student_id = request.args.get("student_id")
    event_type = request.args.get("event_type")
    limit = int(request.args.get("limit", 100))

    query = BiometricLog.query
    if student_id:
        query = query.filter(BiometricLog.student_id == student_id)
    if event_type:
        query = query.filter(BiometricLog.event_type == event_type)

    logs = query.order_by(BiometricLog.timestamp.desc()).limit(limit).all()
    return jsonify([log.to_dict() for log in logs]), 200


@biometric_bp.route("/logs", methods=["POST"])
@jwt_required()
def add_log():
    """Receive entry/exit events pushed from biometric device."""
    data = request.get_json() or {}
    biometric_id = data.get("biometric_id")
    student = None
    if biometric_id:
        student = Student.query.filter_by(biometric_id=biometric_id).first()

    log = BiometricLog(
        student_id=student.id if student else None,
        event_type=data.get("event_type", "entry"),
        device_id=data.get("device_id"),
        notes=data.get("notes"),
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201


@biometric_bp.route("/status", methods=["GET"])
@jwt_required()
def biometric_status():
    total = Student.query.count()
    enabled = Student.query.filter_by(biometric_enabled=True).count()
    enrolled = Student.query.filter(Student.essl_uid.isnot(None)).count()
    cfg = _get_device_cfg()
    return jsonify({
        "total": total,
        "enabled": enabled,
        "disabled": total - enabled,
        "enrolled": enrolled,
        "device_status": cfg.status,
        "device_ip": cfg.ip_address,
        "last_sync": cfg.last_sync.isoformat() if cfg.last_sync else None,
    }), 200
