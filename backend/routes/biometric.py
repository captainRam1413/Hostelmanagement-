from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Student, BiometricLog

biometric_bp = Blueprint("biometric", __name__)


def _sync_with_device(student, enable):
    """
    Stub for actual ESSL / ZKTeco device integration.
    Replace this function body with real SDK/API calls.
    Returns (success: bool, message: str)
    """
    # TODO: Integrate with ESSL device SDK
    # e.g., call ZK library or ESSL REST API
    action = "enabled" if enable else "disabled"
    return True, f"Fingerprint access {action} (simulated)"


@biometric_bp.route("/sync/<int:student_id>", methods=["POST"])
@jwt_required()
def sync_student(student_id):
    student = Student.query.get_or_404(student_id)
    enable = student.payment_status == "active"
    success, message = _sync_with_device(student, enable)

    if success:
        student.biometric_enabled = enable
        log = BiometricLog(
            student_id=student.id,
            event_type="sync",
            notes=message,
        )
        db.session.add(log)
        db.session.commit()

    return jsonify({"success": success, "message": message, "biometric_enabled": student.biometric_enabled}), 200


@biometric_bp.route("/override/<int:student_id>", methods=["POST"])
@jwt_required()
def override_access(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json()
    enable = data.get("enable", False)

    success, message = _sync_with_device(student, enable)
    if success:
        student.biometric_enabled = enable
        log = BiometricLog(
            student_id=student.id,
            event_type="sync",
            notes=f"Manual override: {'enabled' if enable else 'disabled'}",
        )
        db.session.add(log)
        db.session.commit()

    return jsonify({"success": success, "message": message, "biometric_enabled": student.biometric_enabled}), 200


@biometric_bp.route("/sync-all", methods=["POST"])
@jwt_required()
def sync_all():
    students = Student.query.all()
    results = []
    for student in students:
        enable = student.payment_status == "active"
        success, message = _sync_with_device(student, enable)
        if success:
            student.biometric_enabled = enable
            log = BiometricLog(
                student_id=student.id,
                event_type="sync",
                notes=f"Batch sync: {message}",
            )
            db.session.add(log)
        results.append({"student_id": student.id, "name": student.name, "success": success, "message": message})
    db.session.commit()
    return jsonify({"synced": len(results), "results": results}), 200


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
    from models import Student
    total = Student.query.count()
    enabled = Student.query.filter_by(biometric_enabled=True).count()
    return jsonify({"total": total, "enabled": enabled, "disabled": total - enabled}), 200
