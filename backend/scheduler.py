from datetime import date
from extensions import db
from models import Student, BiometricLog


def check_and_update_expired_students(app):
    """Daily cron: expire students whose plan end_date has passed."""
    with app.app_context():
        today = date.today()
        expired_students = Student.query.filter(
            Student.payment_status == "active",
            Student.end_date < today,
        ).all()

        for student in expired_students:
            student.payment_status = "expired"
            if student.biometric_enabled:
                student.biometric_enabled = False
                log = BiometricLog(
                    student_id=student.id,
                    event_type="sync",
                    notes="Auto-deactivated: plan expired",
                )
                db.session.add(log)

        if expired_students:
            db.session.commit()
            print(f"[Scheduler] Expired {len(expired_students)} student(s)")
        else:
            print("[Scheduler] No new expirations today")


def init_scheduler(app):
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=check_and_update_expired_students,
        args=[app],
        trigger="cron",
        hour=0,
        minute=5,
        id="daily_expiry_check",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler
