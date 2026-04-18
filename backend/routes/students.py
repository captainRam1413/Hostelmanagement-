import os
import calendar
from datetime import date, datetime, timedelta
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from extensions import db
from models import Student, Room, BiometricLog

students_bp = Blueprint("students", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}

PLAN_MONTHS = {
    "monthly": 1,
    "3months": 3,
    "6months": 6,
    "12months": 12,
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def calculate_end_date(start_date, plan_type):
    months = PLAN_MONTHS.get(plan_type, 1)
    new_month = start_date.month + months
    new_year = start_date.year + (new_month - 1) // 12
    new_month = (new_month - 1) % 12 + 1
    try:
        return start_date.replace(year=new_year, month=new_month)
    except ValueError:
        # Handle month-end edge cases (e.g. Jan 31 + 1 month = Feb 28/29)
        last_day = calendar.monthrange(new_year, new_month)[1]
        return start_date.replace(year=new_year, month=new_month, day=last_day)


@students_bp.route("", methods=["GET"])
@jwt_required()
def get_students():
    search = request.args.get("search", "")
    status = request.args.get("status", "")
    room_id = request.args.get("room_id", "")

    query = Student.query
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Student.payment_status == status)
    if room_id:
        query = query.filter(Student.room_id == room_id)

    students = query.order_by(Student.name).all()
    return jsonify([s.to_dict() for s in students]), 200


@students_bp.route("/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict()), 200


@students_bp.route("", methods=["POST"])
@jwt_required()
def create_student():
    data = request.form if request.content_type and "multipart" in request.content_type else request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "Name is required"}), 400

    start_date = None
    end_date = None
    plan_type = data.get("plan_type", "monthly")

    if data.get("start_date"):
        start_date = date.fromisoformat(data["start_date"])
        end_date = calculate_end_date(start_date, plan_type)

    student = Student(
        name=data["name"],
        phone=data.get("phone"),
        email=data.get("email"),
        room_id=data.get("room_id") or None,
        plan_type=plan_type,
        start_date=start_date,
        end_date=end_date,
        payment_status=data.get("payment_status", "pending"),
        biometric_id=data.get("biometric_id"),
    )

    db.session.add(student)
    db.session.flush()

    # Handle file uploads
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    for field in ["id_proof", "photo"]:
        if request.files and field in request.files:
            file = request.files[field]
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{student.id}_{field}_{file.filename}")
                os.makedirs(upload_folder, exist_ok=True)
                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)
                if field == "id_proof":
                    student.id_proof_path = filename
                else:
                    student.photo_path = filename

    # Update room occupancy
    if student.room_id:
        room = Room.query.get(student.room_id)
        if room:
            room.occupied += 1

    db.session.commit()
    return jsonify(student.to_dict()), 201


@students_bp.route("/<int:student_id>", methods=["PUT"])
@jwt_required()
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.form if request.content_type and "multipart" in request.content_type else request.get_json()

    old_room_id = student.room_id

    for field in ["name", "phone", "email", "plan_type", "payment_status", "biometric_id"]:
        if data.get(field) is not None:
            setattr(student, field, data[field])

    if data.get("room_id") is not None:
        new_room_id = int(data["room_id"]) if data["room_id"] else None
        if new_room_id != old_room_id:
            if old_room_id:
                old_room = Room.query.get(old_room_id)
                if old_room:
                    old_room.occupied = max(0, old_room.occupied - 1)
            if new_room_id:
                new_room = Room.query.get(new_room_id)
                if new_room:
                    new_room.occupied += 1
            student.room_id = new_room_id

    if data.get("start_date"):
        student.start_date = date.fromisoformat(data["start_date"])
        student.end_date = calculate_end_date(student.start_date, student.plan_type)

    # Handle file uploads
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    for field in ["id_proof", "photo"]:
        if request.files and field in request.files:
            file = request.files[field]
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{student.id}_{field}_{file.filename}")
                os.makedirs(upload_folder, exist_ok=True)
                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)
                if field == "id_proof":
                    student.id_proof_path = filename
                else:
                    student.photo_path = filename

    db.session.commit()
    return jsonify(student.to_dict()), 200


@students_bp.route("/<int:student_id>", methods=["DELETE"])
@jwt_required()
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    if student.room_id:
        room = Room.query.get(student.room_id)
        if room:
            room.occupied = max(0, room.occupied - 1)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"}), 200


@students_bp.route("/uploads/<filename>")
@jwt_required()
def serve_upload(filename):
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    return send_from_directory(os.path.abspath(upload_folder), filename)
