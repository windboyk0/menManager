from sqlalchemy import Column, String, Integer, DateTime, Text
from app.db.database import Base


class Member(Base):
    __tablename__ = "members"

    employee_id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 관리자/일반
    created_at = Column(DateTime, nullable=False)
    last_login_at = Column(DateTime, nullable=True)


class MemberHistory(Base):
    __tablename__ = "member_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    changed_at = Column(DateTime, nullable=False)
    employee_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # INSERT/UPDATE/DELETE
    old_values = Column(Text, nullable=True)  # JSON, null for INSERT
    new_values = Column(Text, nullable=True)  # JSON, null for DELETE
    changed_by = Column(String, nullable=False)
