from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date


def check_expired_students():
    from app import app
    from models import db, Student, Log

    with app.app_context():
        today = date.today()
        expired = Student.query.filter(
            Student.end_date < today,
            Student.is_active == True,
        ).all()

        for student in expired:
            student.is_active = False
            log = Log(
                student_id=student.id,
                log_type="exit",
                method="system",
                device_id="scheduler",
            )
            db.session.add(log)

        if expired:
            db.session.commit()
            print(f"[Scheduler] Marked {len(expired)} students as expired.")


def init_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=check_expired_students,
        trigger="cron",
        hour=0,
        minute=0,
        id="check_expired_students",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler
