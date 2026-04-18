from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Log
from datetime import datetime

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/logs", methods=["GET"])
@jwt_required()
def list_logs():
    query = Log.query
    student_id = request.args.get("student_id")
    log_type = request.args.get("type")
    date_from = request.args.get("from")
    date_to = request.args.get("to")

    if student_id:
        query = query.filter(Log.student_id == int(student_id))
    if log_type:
        query = query.filter(Log.log_type == log_type)
    if date_from:
        try:
            query = query.filter(Log.timestamp >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Log.timestamp <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    logs = query.order_by(Log.timestamp.desc()).limit(500).all()
    return jsonify([l.to_dict() for l in logs]), 200


@logs_bp.route("/logs", methods=["POST"])
@jwt_required()
def create_log():
    data = request.get_json()
    if not data.get("log_type"):
        return jsonify({"error": "log_type is required"}), 400

    try:
        log = Log(
            student_id=data.get("student_id"),
            log_type=data["log_type"],
            device_id=data.get("device_id", "manual"),
            method=data.get("method", "manual"),
        )
        db.session.add(log)
        db.session.commit()
        return jsonify(log.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
