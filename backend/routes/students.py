from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Student
from datetime import date

students_bp = Blueprint("students", __name__)


@students_bp.route("/students", methods=["GET"])
@jwt_required()
def list_students():
    query = Student.query
    search = request.args.get("search", "").strip()
    is_active = request.args.get("is_active")
    plan_type = request.args.get("plan_type")

    if search:
        query = query.filter(
            db.or_(
                Student.name.ilike(f"%{search}%"),
                Student.phone.ilike(f"%{search}%"),
                Student.room_number.ilike(f"%{search}%"),
            )
        )
    if is_active is not None:
        query = query.filter(Student.is_active == (is_active.lower() == "true"))
    if plan_type:
        query = query.filter(Student.plan_type == plan_type)

    students = query.order_by(Student.created_at.desc()).all()
    return jsonify([s.to_dict() for s in students]), 200


@students_bp.route("/students", methods=["POST"])
@jwt_required()
def create_student():
    data = request.get_json()
    required = ["name", "phone", "room_number", "plan_type", "start_date", "end_date"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    try:
        student = Student(
            name=data["name"],
            phone=data["phone"],
            room_number=data["room_number"],
            plan_type=data["plan_type"],
            start_date=date.fromisoformat(data["start_date"]),
            end_date=date.fromisoformat(data["end_date"]),
            is_active=data.get("is_active", True),
            photo_url=data.get("photo_url"),
            id_proof_url=data.get("id_proof_url"),
        )
        db.session.add(student)

        # Update room occupancy
        from models import Room
        room = Room.query.filter_by(room_number=data["room_number"]).first()
        if room:
            room.occupied = min(room.occupied + 1, room.capacity)

        db.session.commit()
        return jsonify(student.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@students_bp.route("/students/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict()), 200


@students_bp.route("/students/<int:student_id>", methods=["PUT"])
@jwt_required()
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json()

    old_room = student.room_number

    try:
        for field in ["name", "phone", "room_number", "plan_type", "is_active", "photo_url", "id_proof_url"]:
            if field in data:
                setattr(student, field, data[field])
        if "start_date" in data:
            student.start_date = date.fromisoformat(data["start_date"])
        if "end_date" in data:
            student.end_date = date.fromisoformat(data["end_date"])

        # Update room occupancy if room changed
        if "room_number" in data and data["room_number"] != old_room:
            from models import Room
            old_room_obj = Room.query.filter_by(room_number=old_room).first()
            if old_room_obj:
                old_room_obj.occupied = max(old_room_obj.occupied - 1, 0)
            new_room_obj = Room.query.filter_by(room_number=data["room_number"]).first()
            if new_room_obj:
                new_room_obj.occupied = min(new_room_obj.occupied + 1, new_room_obj.capacity)

        db.session.commit()
        return jsonify(student.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@students_bp.route("/students/<int:student_id>", methods=["DELETE"])
@jwt_required()
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    try:
        # Decrement room occupancy
        from models import Room
        room = Room.query.filter_by(room_number=student.room_number).first()
        if room:
            room.occupied = max(room.occupied - 1, 0)

        db.session.delete(student)
        db.session.commit()
        return jsonify({"message": "Student deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
