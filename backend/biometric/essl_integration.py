"""
Mock ESSL biometric device integration.
In production, replace the mock methods with actual ESSL SDK/API calls.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

_mock_logs = []
_synced_users = {}
_active_users = set()


class ESSLDevice:
    def __init__(self, host: str = "192.168.1.100", port: int = 4370):
        self.host = host
        self.port = port
        self.connected = False

    def connect(self) -> bool:
        """Simulate connecting to the ESSL device."""
        logger.info(f"[ESSL] Connecting to {self.host}:{self.port}")
        self.connected = True
        return True

    def sync_user(self, student) -> dict:
        """Sync a student record to the biometric device."""
        try:
            _synced_users[student.id] = {
                "uid": student.id,
                "name": student.name,
                "synced_at": datetime.utcnow().isoformat(),
            }
            _mock_logs.append({
                "event": "sync",
                "student_id": student.id,
                "student_name": student.name,
                "timestamp": datetime.utcnow().isoformat(),
            })
            logger.info(f"[ESSL] Synced student {student.id} - {student.name}")
            return {
                "success": True,
                "message": f"Student '{student.name}' synced to device",
                "uid": student.id,
                "synced_at": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            logger.error(f"[ESSL] sync_user failed: {exc}")
            return {"success": False, "message": str(exc)}

    def activate_user(self, user_id: int) -> dict:
        """Enable fingerprint access for a student."""
        _active_users.add(user_id)
        logger.info(f"[ESSL] Activated user {user_id}")
        return {
            "success": True,
            "message": f"User {user_id} fingerprint access activated",
            "user_id": user_id,
            "active": True,
        }

    def deactivate_user(self, user_id: int) -> dict:
        """Disable fingerprint access for a student."""
        _active_users.discard(user_id)
        logger.info(f"[ESSL] Deactivated user {user_id}")
        return {
            "success": True,
            "message": f"User {user_id} fingerprint access deactivated",
            "user_id": user_id,
            "active": False,
        }

    def get_logs(self) -> list:
        """Return mock attendance/access logs from the device."""
        return list(reversed(_mock_logs[-100:]))

    def get_user_status(self, user_id: int) -> dict:
        """Return sync and activation status of a student."""
        return {
            "user_id": user_id,
            "synced": user_id in _synced_users,
            "active": user_id in _active_users,
            "sync_info": _synced_users.get(user_id),
        }
