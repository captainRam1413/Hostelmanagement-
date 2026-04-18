from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Log, Student
from biometric.essl_integration import ESSLDevice

biometric_bp = Blueprint("biometric", __name__)
device = ESSLDevice(host="192.168.1.100", port=4370)


@biometric_bp.route("/biometric/sync-user", methods=["POST"])
@jwt_required()
def sync_user():
    data = request.get_json()
    student_id = data.get("student_id")
    if not student_id:
        return jsonify({"error": "student_id required"}), 400

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    result = device.sync_user(student)
    return jsonify(result), 200


@biometric_bp.route("/biometric/activate-user", methods=["POST"])
@jwt_required()
def activate_user():
    data = request.get_json()
    user_id = data.get("student_id")
    if not user_id:
        return jsonify({"error": "student_id required"}), 400

    result = device.activate_user(user_id)
    return jsonify(result), 200


@biometric_bp.route("/biometric/deactivate-user", methods=["POST"])
@jwt_required()
def deactivate_user():
    data = request.get_json()
    user_id = data.get("student_id")
    if not user_id:
        return jsonify({"error": "student_id required"}), 400

    result = device.deactivate_user(user_id)
    return jsonify(result), 200


@biometric_bp.route("/biometric/logs", methods=["GET"])
@jwt_required()
def biometric_logs():
    logs = device.get_logs()
    return jsonify(logs), 200
