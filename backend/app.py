import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from extensions import db, jwt
from models import User
from routes.auth import auth_bp
from routes.students import students_bp
from routes.payments import payments_bp
from routes.rooms import rooms_bp
from routes.biometric import biometric_bp
from routes.reports import reports_bp


def create_app():
    app = Flask(__name__)

    # Config
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(base_dir, 'hostel.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    jwt_secret = os.environ.get("JWT_SECRET_KEY")
    if not jwt_secret:
        import warnings
        warnings.warn(
            "JWT_SECRET_KEY is not set. Using an insecure default. "
            "Set JWT_SECRET_KEY environment variable before deploying.",
            stacklevel=2,
        )
        jwt_secret = "change-me-in-production"
    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["UPLOAD_FOLDER"] = os.path.join(base_dir, "uploads")

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(rooms_bp, url_prefix="/api/rooms")
    app.register_blueprint(biometric_bp, url_prefix="/api/biometric")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    with app.app_context():
        db.create_all()
        _seed_admin()

    return app


def _seed_admin():
    """Create default admin user if none exists."""
    if not User.query.filter_by(username="admin").first():
        admin = User(
            username="admin",
            password_hash=generate_password_hash("admin123"),
            role="admin",
        )
        db.session.add(admin)
        db.session.commit()
        print("[Seed] Default admin created: admin / admin123")


if __name__ == "__main__":
    app = create_app()
    from scheduler import init_scheduler
    init_scheduler(app)
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, host="0.0.0.0", port=5000)
