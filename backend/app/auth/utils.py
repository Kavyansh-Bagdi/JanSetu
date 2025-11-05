import bcrypt
from datetime import timedelta, datetime, timezone
from app.core.config import settings
import jwt as pyjwt 

import logging

ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def generate_password_hash(password: str) -> str:
    """
    Generate a hashed password using bcrypt.
    Bcrypt has a 72-byte password limit, so we truncate if necessary.
    """
    # Encode password to bytes and truncate to 72 bytes if necessary
    password_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for storage
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    # Encode and truncate password (same as in hashing)
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(user_data: dict, expiry: timedelta = None) -> str:
    """Create a JWT access token."""
    if expiry is None:
        expiry = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Use timezone-aware datetime in UTC
    now = datetime.now(timezone.utc)
    expiration_time = now + expiry
    expiration_timestamp = int(expiration_time.timestamp())
    
    payload = {
        "sub": user_data.get("sub", ""),
        "email": user_data.get("email", ""),
        "user_type": user_data.get("user_type", "citizen"),
        "exp": expiration_timestamp,
        "iat": int(now.timestamp())
    }
    
    token = pyjwt.encode(
        payload=payload,
        key=settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return token


def decode_access_token(token: str) -> dict:
    """Decode a JWT access token."""
    try:
        payload = pyjwt.decode(
            jwt=token,
            key=settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {"status": "valid", "payload": payload}
    except pyjwt.ExpiredSignatureError:
        return {"status": "expired", "payload": {}}
    except pyjwt.InvalidTokenError:
        return {"status": "invalid", "payload": {}}
    except Exception as e:
        logging.error(f"Token decode error: {e}")
        return {"status": "error", "payload": {}}
    
