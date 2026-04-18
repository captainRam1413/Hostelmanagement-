from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Payment, Student
from routes.students import calculate_end_date

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("", methods=["GET"])
@jwt_required()
def get_payments():
    student_id = request.args.get("student_id")
    query = Payment.query
    if student_id:
        query = query.filter(Payment.student_id == student_id)
    payments = query.order_by(Payment.created_at.desc()).all()
    return jsonify([p.to_dict() for p in payments]), 200


@payments_bp.route("", methods=["POST"])
@jwt_required()
def create_payment():
    data = request.get_json()
    if not data or not data.get("student_id") or not data.get("amount"):
        return jsonify({"error": "student_id and amount are required"}), 400

    student = Student.query.get_or_404(data["student_id"])
    plan_type = data.get("plan_type", student.plan_type or "monthly")
    paid_date = date.fromisoformat(data["paid_date"]) if data.get("paid_date") else date.today()
    start_date = date.fromisoformat(data["start_date"]) if data.get("start_date") else paid_date
    end_date = calculate_end_date(start_date, plan_type)

    payment = Payment(
        student_id=student.id,
        amount=float(data["amount"]),
        plan_type=plan_type,
        paid_date=paid_date,
        start_date=start_date,
        end_date=end_date,
        notes=data.get("notes"),
    )
    db.session.add(payment)

    # Update student plan dates and status
    student.plan_type = plan_type
    student.start_date = start_date
    student.end_date = end_date
    student.payment_status = "active"

    db.session.commit()
    return jsonify(payment.to_dict()), 201


@payments_bp.route("/<int:payment_id>", methods=["DELETE"])
@jwt_required()
def delete_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({"message": "Payment deleted"}), 200


@payments_bp.route("/summary", methods=["GET"])
@jwt_required()
def payment_summary():
    today = date.today()
    active = Student.query.filter(
        Student.payment_status == "active",
        Student.end_date >= today
    ).count()
    expired = Student.query.filter(
        (Student.payment_status == "expired") |
        (Student.end_date < today)
    ).count()
    expiring_soon = Student.query.filter(
        Student.payment_status == "active",
        Student.end_date >= today,
        Student.end_date <= date.fromordinal(today.toordinal() + 7)
    ).count()
    total_students = Student.query.count()
    return jsonify({
        "total_students": total_students,
        "active": active,
        "expired": expired,
        "expiring_soon": expiring_soon,
    }), 200
