from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.config import get_settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        return password_hash.verify(password, encoded_hash)
    except (ValueError, TypeError):
        return False


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def create_token(user_id: str, token_type: str, lifetime: timedelta) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + lifetime
    token_id = str(uuid4())
    payload = {
        "sub": user_id,
        "jti": token_id,
        "type": token_type,
        "iat": now,
        "exp": expires_at,
    }
    token = jwt.encode(payload, get_settings().jwt_secret_key, algorithm="HS256")
    return token, token_id, expires_at


def decode_token(token: str) -> dict:
    return jwt.decode(token, get_settings().jwt_secret_key, algorithms=["HS256"])