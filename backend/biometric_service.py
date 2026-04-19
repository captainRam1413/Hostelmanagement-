"""
biometric_service.py
Real ESSL / ZKTeco device integration layer using pyzk.
All callers should use the functions here – they handle ZK connection
lifecycle and return (success: bool, data/message).
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── pyzk import (graceful degradation when device is offline) ──────────────
try:
    from zk import ZK, const as zk_const
    ZK_AVAILABLE = True
except ImportError:
    ZK_AVAILABLE = False
    logger.warning("pyzk not installed. Install with: pip install pyzk")


def _get_zk(ip: str, port: int = 4370, timeout: int = 10):
    """Return an *unconnected* ZK instance."""
    if not ZK_AVAILABLE:
        raise RuntimeError("pyzk is not installed")
    return ZK(ip, port=port, timeout=timeout, password=0, force_udp=False, ommit_ping=False)


# ── Public API ──────────────────────────────────────────────────────────────

def test_connection(ip: str, port: int = 4370):
    """
    Test connectivity to the ESSL device.
    Returns (success, info_dict_or_message).
    """
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            info = {
                "serial_number": conn.get_serialnumber(),
                "firmware_version": conn.get_firmware_version(),
                "platform": conn.get_platform(),
                "users": conn.get_user_count(),
            }
        finally:
            conn.disconnect()
        return True, info
    except Exception as exc:
        logger.error("test_connection failed: %s", exc)
        return False, str(exc)


def enroll_user(ip: str, port: int, uid: int, user_id: str, name: str):
    """
    Put device in live-capture / enrollment mode for *uid*.
    Saves the fingerprint template (finger index 0, quality 0).
    Returns (success, message).

    NOTE: ZKTeco enrollment via pyzk uses the "live_capture" approach
    which requires the user to place their finger on the device.
    The call blocks until a template is captured or times out.
    """
    try:
        zk = _get_zk(ip, port, timeout=30)
        conn = zk.connect()
        try:
            conn.disable_device()
            # Create / update user record on device
            conn.set_user(uid=uid, name=name[:24], privilege=zk_const.USER_DEFAULT,
                          password="", group_id="", user_id=str(user_id))
            # Enroll fingerprint – finger=0, new_enrollment=True blocks until scan
            conn.enroll_user(uid=uid, temp_id=0)
            conn.enable_device()
        finally:
            conn.disconnect()
        return True, f"Fingerprint enrolled for UID {uid}"
    except Exception as exc:
        logger.error("enroll_user failed: %s", exc)
        return False, str(exc)


def activate_user(ip: str, port: int, uid: int, user_id: str, name: str):
    """
    Add / re-enable a user on the device.
    Returns (success, message).
    """
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            conn.disable_device()
            conn.set_user(uid=uid, name=name[:24], privilege=zk_const.USER_DEFAULT,
                          password="", group_id="", user_id=str(user_id))
            conn.enable_device()
        finally:
            conn.disconnect()
        return True, f"User UID {uid} activated on device"
    except Exception as exc:
        logger.error("activate_user failed: %s", exc)
        return False, str(exc)


def deactivate_user(ip: str, port: int, uid: int):
    """
    Remove a user from the device (disables biometric access).
    Returns (success, message).
    """
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            conn.disable_device()
            conn.delete_user(uid=uid)
            conn.enable_device()
        finally:
            conn.disconnect()
        return True, f"User UID {uid} removed from device"
    except Exception as exc:
        logger.error("deactivate_user failed: %s", exc)
        return False, str(exc)


def pull_attendance_logs(ip: str, port: int):
    """
    Fetch all attendance records from the device.
    Returns (success, list_of_dicts | message).
    Each dict: {uid, user_id, timestamp, status, punch}
    """
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            attendances = conn.get_attendance()
            logs = []
            for att in attendances:
                logs.append({
                    "uid": att.uid,
                    "user_id": att.user_id,
                    "timestamp": att.timestamp.isoformat() if hasattr(att.timestamp, 'isoformat') else str(att.timestamp),
                    "status": att.status,
                    "punch": att.punch,
                })
        finally:
            conn.disconnect()
        return True, logs
    except Exception as exc:
        logger.error("pull_attendance_logs failed: %s", exc)
        return False, str(exc)


def restart_device(ip: str, port: int):
    """Restart the ZKTeco device."""
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            conn.restart()
        finally:
            try:
                conn.disconnect()
            except Exception:
                pass
        return True, "Device restart command sent"
    except Exception as exc:
        logger.error("restart_device failed: %s", exc)
        return False, str(exc)


def clear_device_data(ip: str, port: int):
    """
    Clears ALL attendance logs from the device.
    Does NOT clear user records (use with caution).
    """
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            conn.disable_device()
            conn.clear_attendance()
            conn.enable_device()
        finally:
            conn.disconnect()
        return True, "Attendance logs cleared from device"
    except Exception as exc:
        logger.error("clear_device_data failed: %s", exc)
        return False, str(exc)


def get_next_uid(ip: str, port: int):
    """Return next available UID slot on the device."""
    try:
        zk = _get_zk(ip, port)
        conn = zk.connect()
        try:
            users = conn.get_users()
            used_uids = {u.uid for u in users}
            uid = 1
            while uid in used_uids:
                uid += 1
        finally:
            conn.disconnect()
        return uid
    except Exception:
        # Fallback: generate a UID from current time if device unreachable
        return int(datetime.utcnow().timestamp()) % 65535 or 1
