import json
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models.employee import Employee, EmployeeHistory
from app.models.member import Member, MemberHistory
from app.schemas.auth import RegisterRequest

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def register(db: Session, data: RegisterRequest) -> Member:
    # Check if employee_id already exists
    existing_emp = db.query(Employee).filter(Employee.employee_id == data.employee_id).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="이미 존재하는 사원 ID입니다")

    # Check if username already exists
    existing_member = db.query(Member).filter(Member.username == data.username).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Create Employee
    employee = Employee(
        employee_id=data.employee_id,
        name=data.name,
        career_years=data.career_years,
        grade=data.grade,
        join_date=data.join_date,
        position=data.position,
        title=data.title,
    )
    db.add(employee)
    db.flush()

    # Record employee INSERT history
    emp_new_values = {
        "employee_id": str(data.employee_id),
        "name": str(data.name),
        "career_years": str(data.career_years),
        "grade": str(data.grade),
        "join_date": str(data.join_date),
        "position": str(data.position),
        "title": str(data.title),
    }
    db.add(EmployeeHistory(
        changed_at=now,
        employee_id=data.employee_id,
        event_type="INSERT",
        old_values=None,
        new_values=json.dumps(emp_new_values, ensure_ascii=False),
        changed_by=data.employee_id,
    ))

    # Create Member
    member = Member(
        employee_id=data.employee_id,
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
        created_at=now,
        last_login_at=None,
    )
    db.add(member)
    db.flush()

    # Record member INSERT history
    member_new_values = {
        "employee_id": str(data.employee_id),
        "username": str(data.username),
        "role": str(data.role),
        "created_at": str(now),
    }
    db.add(MemberHistory(
        changed_at=now,
        employee_id=data.employee_id,
        event_type="INSERT",
        old_values=None,
        new_values=json.dumps(member_new_values, ensure_ascii=False),
        changed_by=data.employee_id,
    ))

    db.commit()
    db.refresh(member)
    return member


def login(db: Session, username: str, password: str) -> str:
    member = db.query(Member).filter(Member.username == username).first()
    if not member:
        raise HTTPException(status_code=401, detail="사용자명 또는 비밀번호가 올바르지 않습니다")

    if not verify_password(password, member.password_hash):
        raise HTTPException(status_code=401, detail="사용자명 또는 비밀번호가 올바르지 않습니다")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    member.last_login_at = now
    db.commit()

    token = create_access_token(data={
        "sub": member.username,
        "employee_id": member.employee_id,
        "role": member.role,
    })
    return token


def change_password(db: Session, employee_id: str, current_password: str, new_password: str) -> None:
    member = db.query(Member).filter(Member.employee_id == employee_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    if not verify_password(current_password, member.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다")
    member.password_hash = hash_password(new_password)
    db.commit()
