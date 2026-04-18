import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from models import db, AdminUser
from auth import auth_bp
from routes.students import students_bp
from routes.payments import payments_bp
from routes.rooms import rooms_bp
from routes.biometric import biometric_bp
from routes.logs import logs_bp
from scheduler import init_scheduler


def create_app():
    app = Flask(__name__)

    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(base_dir, 'hostel.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Load secret from env; fall back to a default only for local dev
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "hostel-secret-key-2024")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours

    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(biometric_bp)
    app.register_blueprint(logs_bp)

    with app.app_context():
        db.create_all()
        _seed_admin()
        _seed_rooms()

    init_scheduler(app)
    return app


def _seed_admin():
    if not AdminUser.query.filter_by(username="admin").first():
        admin = AdminUser(
            username="admin",
            password_hash=generate_password_hash("admin123"),
        )
        db.session.add(admin)
        db.session.commit()


def _seed_rooms():
    from models import Room
    if Room.query.count() == 0:
        rooms = [
            Room(room_number="101", capacity=2, occupied=0, floor=1, description="Standard double room"),
            Room(room_number="102", capacity=2, occupied=0, floor=1, description="Standard double room"),
            Room(room_number="103", capacity=3, occupied=0, floor=1, description="Triple sharing room"),
            Room(room_number="201", capacity=2, occupied=0, floor=2, description="Deluxe double room"),
            Room(room_number="202", capacity=2, occupied=0, floor=2, description="Deluxe double room"),
            Room(room_number="203", capacity=1, occupied=0, floor=2, description="Single occupancy room"),
        ]
        db.session.add_all(rooms)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, port=5000)
