from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    user = User.query.filter_by(username=data["username"]).first()
    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username},
    )
    return jsonify({"access_token": token, "role": user.role, "username": user.username}), 200


@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    from flask_jwt_extended import jwt_required, get_jwt_identity

    @jwt_required()
    def inner():
        user_id = get_jwt_identity()
        data = request.get_json()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        if not check_password_hash(user.password_hash, data.get("old_password", "")):
            return jsonify({"error": "Old password incorrect"}), 400
        user.password_hash = generate_password_hash(data["new_password"])
        db.session.commit()
        return jsonify({"message": "Password changed"}), 200

    return inner()
