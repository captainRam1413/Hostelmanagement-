from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Student, BiometricLog, DeviceConfig
import biometric_service as bs

biometric_bp = Blueprint("biometric", __name__)


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


# ── Device Config endpoints ──────────────────────────────────────────────────

@biometric_bp.route("/device", methods=["GET"])
@jwt_required()
def get_device_config():
    cfg = _get_device_cfg()
    return jsonify(cfg.to_dict()), 200


@biometric_bp.route("/device", methods=["PUT"])
@jwt_required()
def update_device_config():
    data = request.get_json()
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
def restart_device():
    cfg = _get_device_cfg()
    success, msg = bs.restart_device(cfg.ip_address, cfg.port)
    if success:
        cfg.status = "disconnected"
        db.session.commit()
    return jsonify({"success": success, "message": msg}), 200


@biometric_bp.route("/device/clear", methods=["POST"])
@jwt_required()
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
    for entry in data:
        student = Student.query.filter_by(id=entry.get("user_id")).first()
        if not student:
            student = Student.query.filter_by(essl_uid=entry.get("uid")).first()

        log = BiometricLog(
            student_id=student.id if student else None,
            event_type="entry" if entry.get("punch") in (0, 4) else "exit",
            timestamp=datetime.fromisoformat(entry["timestamp"]) if entry.get("timestamp") else datetime.utcnow(),
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
        uid = u.get("uid")
        user_id = str(u.get("user_id"))
        name = u.get("name") or f"Device User {uid}"

        # Try to find existing student by essl_uid
        student = Student.query.filter_by(essl_uid=uid).first()
        if not student:
            # Try to find by DB id if user_id is a number
            if user_id.isdigit():
                student = Student.query.filter_by(id=int(user_id)).first()

        if student:
            # Update
            if not student.essl_uid:
                student.essl_uid = uid
            student.biometric_enabled = True
            if not student.biometric_id:
                student.biometric_id = str(uid)
            updated += 1
        else:
            # Create new student
            student = Student(
                name=name,
                email=f"user{uid}@device.local",
                phone=f"000000{uid:04d}",
                room_number="TBD",
                payment_status="active",
                essl_uid=uid,
                biometric_enabled=True,
                biometric_id=str(uid)
            )
            db.session.add(student)
            imported += 1

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
    data = request.get_json()
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
    students = Student.query.all()
    cfg = _get_device_cfg()
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
    db.session.commit()
    return jsonify({"synced": len(results), "results": results}), 200


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
    data = request.get_json()
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
