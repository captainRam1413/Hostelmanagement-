from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Room

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/rooms", methods=["GET"])
@jwt_required()
def list_rooms():
    rooms = Room.query.order_by(Room.floor, Room.room_number).all()
    return jsonify([r.to_dict() for r in rooms]), 200


@rooms_bp.route("/rooms", methods=["POST"])
@jwt_required()
def create_room():
    data = request.get_json()
    if not data.get("room_number"):
        return jsonify({"error": "room_number is required"}), 400

    if Room.query.filter_by(room_number=data["room_number"]).first():
        return jsonify({"error": "Room number already exists"}), 409

    try:
        room = Room(
            room_number=data["room_number"],
            capacity=int(data.get("capacity", 2)),
            occupied=int(data.get("occupied", 0)),
            floor=int(data.get("floor", 1)),
            description=data.get("description", ""),
        )
        db.session.add(room)
        db.session.commit()
        return jsonify(room.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@rooms_bp.route("/rooms/<int:room_id>", methods=["GET"])
@jwt_required()
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    return jsonify(room.to_dict()), 200


@rooms_bp.route("/rooms/<int:room_id>", methods=["PUT"])
@jwt_required()
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.get_json()
    try:
        for field in ["room_number", "description"]:
            if field in data:
                setattr(room, field, data[field])
        for field in ["capacity", "occupied", "floor"]:
            if field in data:
                setattr(room, field, int(data[field]))
        db.session.commit()
        return jsonify(room.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@rooms_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
@jwt_required()
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    try:
        db.session.delete(room)
        db.session.commit()
        return jsonify({"message": "Room deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
