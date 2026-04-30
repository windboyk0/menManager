import json
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.employee import Employee, EmployeeHistory
from app.models.assignment import Assignment
from app.models.skill import Skill, EmployeeSkill
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.schemas.skill import EmployeeSkillCreate, EmployeeSkillUpdate


def _record_history(
    db: Session,
    employee_id: str,
    event_type: str,
    old_values: dict | None,
    new_values: dict | None,
    changed_by: str,
    now: datetime,
) -> None:
    db.add(EmployeeHistory(
        changed_at=now,
        employee_id=employee_id,
        event_type=event_type,
        old_values=json.dumps(old_values, ensure_ascii=False) if old_values is not None else None,
        new_values=json.dumps(new_values, ensure_ascii=False) if new_values is not None else None,
        changed_by=changed_by,
    ))


def create(db: Session, data: EmployeeCreate, changed_by: str) -> Employee:
    existing = db.query(Employee).filter(Employee.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 사원 ID입니다")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

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

    new_values = {
        "employee_id": str(data.employee_id),
        "name": str(data.name),
        "career_years": str(data.career_years),
        "grade": str(data.grade),
        "join_date": str(data.join_date),
        "position": str(data.position),
        "title": str(data.title),
    }
    _record_history(db, data.employee_id, "INSERT", None, new_values, changed_by, now)

    db.commit()
    db.refresh(employee)
    return employee


def get_all(
    db: Session,
    grade: Optional[str] = None,
    available_from: Optional[date] = None,
    available_to: Optional[date] = None,
    skill_ids: Optional[list[int]] = None,
) -> list[Employee]:
    query = db.query(Employee)

    if grade:
        query = query.filter(Employee.grade == grade)

    if available_from is not None and available_to is not None:
        # Exclude employees whose total overlapping manpower >= 1.0
        # Overlapping means: assignment.start <= available_to AND assignment.end >= available_from
        busy_subquery = (
            db.query(Assignment.employee_id)
            .filter(
                and_(
                    Assignment.actual_start_date <= available_to,
                    Assignment.actual_end_date >= available_from,
                )
            )
            .group_by(Assignment.employee_id)
            .having(func.sum(Assignment.actual_manpower) >= 1.0)
            .subquery()
            .select()
        )
        query = query.filter(Employee.employee_id.notin_(busy_subquery))

    if skill_ids:
        # Only return employees who have ALL specified skills
        for skill_id in skill_ids:
            skill_subquery = (
                db.query(EmployeeSkill.employee_id)
                .filter(EmployeeSkill.skill_id == skill_id)
                .subquery()
                .select()
            )
            query = query.filter(Employee.employee_id.in_(skill_subquery))

    return query.all()


def get_by_id(db: Session, employee_id: str) -> Employee:
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="사원을 찾을 수 없습니다")
    return employee


def update(db: Session, employee_id: str, data: EmployeeUpdate, changed_by: str) -> Employee:
    employee = get_by_id(db, employee_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    update_data = data.model_dump(exclude_unset=True)
    old_snap: dict = {}
    new_snap: dict = {}

    for field, new_val in update_data.items():
        old_val = getattr(employee, field)
        if old_val != new_val:
            old_snap[field] = str(old_val) if old_val is not None else None
            new_snap[field] = str(new_val) if new_val is not None else None
            setattr(employee, field, new_val)

    if old_snap:
        _record_history(db, employee_id, "UPDATE", old_snap, new_snap, changed_by, now)

    db.commit()
    db.refresh(employee)
    return employee


def delete(db: Session, employee_id: str, changed_by: str) -> None:
    employee = get_by_id(db, employee_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    old_values = {
        "employee_id": str(employee.employee_id),
        "name": str(employee.name),
        "career_years": str(employee.career_years),
        "grade": str(employee.grade),
        "join_date": str(employee.join_date),
        "position": str(employee.position),
        "title": str(employee.title),
    }
    _record_history(db, employee_id, "DELETE", old_values, None, changed_by, now)

    db.delete(employee)
    db.commit()


def get_history(db: Session, employee_id: str) -> list[EmployeeHistory]:
    return (
        db.query(EmployeeHistory)
        .filter(EmployeeHistory.employee_id == employee_id)
        .order_by(EmployeeHistory.changed_at.desc())
        .all()
    )


def add_skill(db: Session, employee_id: str, data: EmployeeSkillCreate) -> EmployeeSkill:
    # Verify employee exists
    get_by_id(db, employee_id)

    # Verify skill exists
    skill = db.query(Skill).filter(Skill.skill_id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="스킬을 찾을 수 없습니다")

    # Check if already assigned
    existing = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == data.skill_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 스킬입니다")

    if not (1 <= data.proficiency <= 5):
        raise HTTPException(status_code=400, detail="숙련도는 1~5 사이여야 합니다")

    employee_skill = EmployeeSkill(
        employee_id=employee_id,
        skill_id=data.skill_id,
        proficiency=data.proficiency,
    )
    db.add(employee_skill)
    db.commit()
    db.refresh(employee_skill)
    return employee_skill


def get_skills(db: Session, employee_id: str) -> list[dict]:
    # Verify employee exists
    get_by_id(db, employee_id)

    results = (
        db.query(EmployeeSkill, Skill)
        .join(Skill, EmployeeSkill.skill_id == Skill.skill_id)
        .filter(EmployeeSkill.employee_id == employee_id)
        .all()
    )

    return [
        {
            "employee_id": emp_skill.employee_id,
            "skill_id": emp_skill.skill_id,
            "proficiency": emp_skill.proficiency,
            "skill_name": skill.skill_name,
            "category": skill.category,
        }
        for emp_skill, skill in results
    ]


def update_skill(
    db: Session,
    employee_id: str,
    skill_id: int,
    data: EmployeeSkillUpdate,
) -> dict:
    # Verify employee exists
    get_by_id(db, employee_id)

    if not (1 <= data.proficiency <= 5):
        raise HTTPException(status_code=400, detail="숙련도는 1~5 사이여야 합니다")

    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == skill_id,
    ).first()
    if not emp_skill:
        raise HTTPException(status_code=404, detail="해당 스킬을 찾을 수 없습니다")

    emp_skill.proficiency = data.proficiency
    db.commit()
    db.refresh(emp_skill)

    skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    return {
        "employee_id": emp_skill.employee_id,
        "skill_id": emp_skill.skill_id,
        "proficiency": emp_skill.proficiency,
        "skill_name": skill.skill_name if skill else "",
        "category": skill.category if skill else "",
    }


def delete_skill(db: Session, employee_id: str, skill_id: int) -> None:
    # Verify employee exists
    get_by_id(db, employee_id)

    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.employee_id == employee_id,
        EmployeeSkill.skill_id == skill_id,
    ).first()
    if not emp_skill:
        raise HTTPException(status_code=404, detail="해당 스킬을 찾을 수 없습니다")

    db.delete(emp_skill)
    db.commit()
