from datetime import datetime, timezone
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.config import settings
from app.models.member import Member

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_data() -> None:
    db: Session = SessionLocal()
    try:
        existing_admin = db.query(Member).filter(Member.username == "admin").first()
        if existing_admin:
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        db.add(Member(
            employee_id="ADMIN",
            username="admin",
            password_hash=pwd_context.hash(settings.ADMIN_PASSWORD),
            role="관리자",
            created_at=now,
            last_login_at=None,
        ))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
