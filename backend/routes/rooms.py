from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Room

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("", methods=["GET"])
@jwt_required()
def get_rooms():
    rooms = Room.query.order_by(Room.room_number).all()
    return jsonify([r.to_dict() for r in rooms]), 200


@rooms_bp.route("/<int:room_id>", methods=["GET"])
@jwt_required()
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = room.to_dict()
    data["students"] = [s.to_dict() for s in room.students]
    return jsonify(data), 200


@rooms_bp.route("", methods=["POST"])
@jwt_required()
def create_room():
    data = request.get_json()
    if not data or not data.get("room_number"):
        return jsonify({"error": "room_number is required"}), 400

    if Room.query.filter_by(room_number=data["room_number"]).first():
        return jsonify({"error": "Room number already exists"}), 409

    room = Room(
        room_number=data["room_number"],
        capacity=int(data.get("capacity", 1)),
        floor=data.get("floor"),
    )
    db.session.add(room)
    db.session.commit()
    return jsonify(room.to_dict()), 201


@rooms_bp.route("/<int:room_id>", methods=["PUT"])
@jwt_required()
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.get_json()
    for field in ["room_number", "capacity", "floor"]:
        if data.get(field) is not None:
            setattr(room, field, data[field])
    db.session.commit()
    return jsonify(room.to_dict()), 200


@rooms_bp.route("/<int:room_id>", methods=["DELETE"])
@jwt_required()
def delete_room(room_id):
    room = Room.query.get_or_404(room_id)
    if room.students:
        return jsonify({"error": "Room has students assigned. Reassign before deleting."}), 400
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Room deleted"}), 200
