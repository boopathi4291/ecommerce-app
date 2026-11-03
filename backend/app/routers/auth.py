import re
from datetime import datetime, timedelta, timezone
from secrets import compare_digest

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import RefreshSession, User
from app.schemas import LoginRequest, RefreshRequest, SignUpRequest, TokenPair, UserPublic
from app.security import create_token, hash_password, hash_refresh_token, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^\+?\d{7,15}$")


def normalize_identifier(value: str) -> tuple[str | None, str | None]:
    normalized = value.strip().lower()
    if EMAIL_PATTERN.fullmatch(normalized):
        return normalized, None
    phone = re.sub(r"[\s().-]", "", value)
    if PHONE_PATTERN.fullmatch(phone):
        return None, phone
    raise HTTPException(status_code=422, detail="Enter a valid email address or mobile number")


def create_token_pair(db: Session, user: User) -> TokenPair:
    settings = get_settings()
    access_token, _, _ = create_token(
        user.id,
        "access",
        timedelta(minutes=settings.access_token_minutes),
    )
    refresh_token, token_id, expires_at = create_token(
        user.id,
        "refresh",
        timedelta(days=settings.refresh_token_days),
    )
    db.add(RefreshSession(
        jti=token_id,
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=expires_at,
    ))
    db.flush()
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_minutes * 60,
        user=UserPublic.model_validate(user),
    )


@router.post("/signup", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)) -> TokenPair:
    email, mobile = normalize_identifier(payload.email_or_mobile)
    identifier_filter = User.email == email if email else User.mobile == mobile
    existing = db.scalar(select(User.id).where(identifier_filter))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for that identifier")

    user = User(
        email=email,
        mobile=mobile,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.flush()
        tokens = create_token_pair(db, user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for that identifier") from exc
    return tokens


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    email, mobile = normalize_identifier(payload.email_or_mobile)
    identifier_filter = User.email == email if email else User.mobile == mobile
    user = db.scalar(select(User).where(identifier_filter))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/mobile or password", headers={"WWW-Authenticate": "Bearer"})
    tokens = create_token_pair(db, user)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    try:
        claims = jwt.decode(payload.refresh_token, get_settings().jwt_secret_key, algorithms=["HS256"])
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token") from exc
    if claims.get("type") != "refresh" or not claims.get("sub") or not claims.get("jti"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    session = db.scalar(select(RefreshSession).where(RefreshSession.jti == claims["jti"]))
    if session is None or session.revoked_at is not None or not compare_digest(session.token_hash, hash_refresh_token(payload.refresh_token)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked or is invalid")
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive account")

    session.revoked_at = datetime.now(timezone.utc)
    tokens = create_token_pair(db, user)
    db.commit()
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )
    db.commit()


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/oauth/{provider}/authorize")
def oauth_authorize(provider: str) -> None:
    if provider not in {"google", "apple"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported OAuth provider")
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"{provider.title()} OAuth credentials are not configured")