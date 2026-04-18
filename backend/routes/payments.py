from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Payment, Student
from datetime import date
import calendar

payments_bp = Blueprint("payments", __name__)

PLAN_MONTHS = {
    "Monthly": 1,
    "3months": 3,
    "6months": 6,
    "12months": 12,
}


def _add_months(d, months):
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return d.replace(year=year, month=month, day=day)


@payments_bp.route("/payments", methods=["GET"])
@jwt_required()
def list_payments():
    query = Payment.query
    student_id = request.args.get("student_id")
    if student_id:
        query = query.filter(Payment.student_id == int(student_id))
    payments = query.order_by(Payment.payment_date.desc()).all()
    return jsonify([p.to_dict() for p in payments]), 200


@payments_bp.route("/payments", methods=["POST"])
@jwt_required()
def create_payment():
    data = request.get_json()
    required = ["student_id", "amount", "plan_type"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    student = Student.query.get(data["student_id"])
    if not student:
        return jsonify({"error": "Student not found"}), 404

    try:
        duration = PLAN_MONTHS.get(data["plan_type"], 1)
        payment_date = date.fromisoformat(data["payment_date"]) if data.get("payment_date") else date.today()

        payment = Payment(
            student_id=data["student_id"],
            amount=float(data["amount"]),
            payment_date=payment_date,
            duration=duration,
            plan_type=data["plan_type"],
            notes=data.get("notes", ""),
        )
        db.session.add(payment)

        # Update student plan and end_date
        student.plan_type = data["plan_type"]
        start = student.end_date if student.end_date and student.end_date >= date.today() else date.today()
        student.end_date = _add_months(start, duration)
        student.is_active = True

        db.session.commit()
        return jsonify(payment.to_dict()), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to create payment"}), 500


@payments_bp.route("/payments/<int:payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    return jsonify(payment.to_dict()), 200


@payments_bp.route("/payments/<int:payment_id>", methods=["DELETE"])
@jwt_required()
def delete_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    try:
        db.session.delete(payment)
        db.session.commit()
        return jsonify({"message": "Payment deleted"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to delete payment"}), 500
