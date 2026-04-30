from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.config import settings
from app.models.member import Member
from app.models.mcp import McpApiKey

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Member:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    member = db.query(Member).filter(Member.username == username).first()
    if not member:
        raise HTTPException(status_code=401, detail="User not found")
    return member


def require_admin(current_user: Member = Depends(get_current_user)) -> Member:
    if current_user.role != "관리자":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user


def verify_api_key(
    x_api_key: str = Header(...),
    db: Session = Depends(get_db),
) -> McpApiKey:
    key = db.query(McpApiKey).filter(
        McpApiKey.api_key == x_api_key,
        McpApiKey.is_active == True,
    ).first()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    key.last_used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return key
