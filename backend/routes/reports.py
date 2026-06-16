import io
import csv
from datetime import date
from collections import defaultdict
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required
from extensions import db
from models import Student, Payment, BiometricLog

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    today = date.today()
    year = today.year
    total_students = Student.query.count()
    active = Student.query.filter(Student.payment_status == "active").count()
    expired = Student.query.filter(Student.payment_status == "expired").count()
    expiring_soon = Student.query.filter(
        Student.payment_status == "active",
        Student.end_date >= today,
        Student.end_date <= date.fromordinal(today.toordinal() + 7),
    ).count()

    recent_logs = (
        BiometricLog.query.order_by(BiometricLog.timestamp.desc()).limit(10).all()
    )

    expiring_students = (
        Student.query.filter(
            Student.payment_status == "active",
            Student.end_date >= today,
            Student.end_date <= date.fromordinal(today.toordinal() + 7),
        )
        .all()
    )

    from models import Room
    total_rooms = Room.query.count()
    occupied_rooms = db.session.query(Room).filter(Room.occupied > 0).count()

    monthly_checkins = defaultdict(int)
    monthly_payments = defaultdict(int)

    year_logs = BiometricLog.query.filter(
        db.extract("year", BiometricLog.timestamp) == year
    ).all()
    for log in year_logs:
        month = log.timestamp.month
        monthly_checkins[month] += 1

    year_payments = Payment.query.filter(
        db.extract("year", Payment.created_at) == year
    ).all()
    for payment in year_payments:
        month = payment.created_at.month
        monthly_payments[month] += 1

    month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_activity = [
        {
            "name": month_labels[index - 1],
            "CheckIns": monthly_checkins.get(index, 0),
            "Payments": monthly_payments.get(index, 0),
        }
        for index in range(1, 13)
    ]

    return jsonify({
        "total_students": total_students,
        "active": active,
        "expired": expired,
        "expiring_soon": expiring_soon,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "monthly_activity": monthly_activity,
        "recent_logs": [l.to_dict() for l in recent_logs],
        "expiring_students": [s.to_dict() for s in expiring_students],
    }), 200


@reports_bp.route("/export/students", methods=["GET"])
@jwt_required()
def export_students():
    students = Student.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Phone", "Email", "Room", "Plan", "Start Date", "End Date", "Status", "Biometric"])
    for s in students:
        writer.writerow([
            s.id, s.name, s.phone, s.email,
            s.room.room_number if s.room else "",
            s.plan_type, s.start_date, s.end_date,
            s.payment_status, "Yes" if s.biometric_enabled else "No",
        ])
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=students.csv"
    response.headers["Content-Type"] = "text/csv"
    return response


@reports_bp.route("/export/payments", methods=["GET"])
@jwt_required()
def export_payments():
    payments = Payment.query.order_by(Payment.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student", "Amount", "Plan", "Paid Date", "Start Date", "End Date", "Notes"])
    for p in payments:
        writer.writerow([
            p.id,
            p.student.name if p.student else "",
            p.amount, p.plan_type, p.paid_date, p.start_date, p.end_date,
            p.notes,
        ])
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=payments.csv"
    response.headers["Content-Type"] = "text/csv"
    return response


@reports_bp.route("/export/logs", methods=["GET"])
@jwt_required()
def export_logs():
    logs = BiometricLog.query.order_by(BiometricLog.timestamp.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student", "Event", "Timestamp", "Device", "Notes"])
    for log in logs:
        writer.writerow([
            log.id,
            log.student.name if log.student else "Unknown",
            log.event_type,
            log.timestamp,
            log.device_id,
            log.notes,
        ])
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=biometric_logs.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
