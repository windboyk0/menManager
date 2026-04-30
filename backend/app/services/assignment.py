import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.assignment import Assignment, AssignmentHistory
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate


def _months_between(start: str, end: str) -> list[str]:
    y1, m1 = int(start[:4]), int(start[5:7])
    y2, m2 = int(end[:4]), int(end[5:7])
    result = []
    while (y1, m1) <= (y2, m2):
        result.append(f"{y1:04d}-{m1:02d}")
        m1 += 1
        if m1 > 12:
            m1 = 1
            y1 += 1
    return result


def _record_history(
    db: Session,
    employee_id: str,
    project_code: str,
    input_month: str,
    event_type: str,
    old_values: dict | None,
    new_values: dict | None,
    changed_by: str,
    now: datetime,
) -> None:
    db.add(AssignmentHistory(
        changed_at=now,
        employee_id=employee_id,
        project_code=project_code,
        input_month=input_month,
        event_type=event_type,
        old_values=json.dumps(old_values, ensure_ascii=False) if old_values is not None else None,
        new_values=json.dumps(new_values, ensure_ascii=False) if new_values is not None else None,
        changed_by=changed_by,
    ))


def check_conflict(
    db: Session,
    employee_id: str,
    months: list[str],
    manpower: float,
    exclude_project: Optional[str] = None,
) -> None:
    for month in months:
        query = db.query(func.sum(Assignment.input_manpower)).filter(
            Assignment.employee_id == employee_id,
            Assignment.input_month == month,
        )
        if exclude_project is not None:
            query = query.filter(Assignment.project_code != exclude_project)

        total = query.scalar()
        existing = float(total) if total is not None else 0.0
        if existing + manpower > 1.0:
            raise HTTPException(
                status_code=409,
                detail=f"배치 충돌: {month} 배치율 합계가 100%를 초과합니다",
            )


def create(db: Session, data: AssignmentCreate, changed_by: str) -> Assignment:
    check_conflict(db, data.employee_id, [data.input_month], float(data.input_manpower))

    existing = db.query(Assignment).filter(
        Assignment.employee_id == data.employee_id,
        Assignment.project_code == data.project_code,
        Assignment.input_month == data.input_month,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"{data.input_month} 배치가 이미 존재합니다")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    assignment = Assignment(
        employee_id=data.employee_id,
        project_code=data.project_code,
        input_month=data.input_month,
        input_manpower=data.input_manpower,
    )
    db.add(assignment)

    new_values = {
        "employee_id": data.employee_id,
        "project_code": data.project_code,
        "input_month": data.input_month,
        "input_manpower": str(data.input_manpower),
    }
    _record_history(db, data.employee_id, data.project_code, data.input_month, "INSERT", None, new_values, changed_by, now)

    db.commit()
    db.refresh(assignment)
    return assignment


def get_all(
    db: Session,
    employee_id: Optional[str] = None,
    project_code: Optional[str] = None,
) -> list[Assignment]:
    query = db.query(Assignment)
    if employee_id:
        query = query.filter(Assignment.employee_id == employee_id)
    if project_code:
        query = query.filter(Assignment.project_code == project_code)
    return query.order_by(Assignment.input_month).all()


def get_by_emp_proj(db: Session, employee_id: str, project_code: str) -> list[Assignment]:
    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.employee_id == employee_id,
            Assignment.project_code == project_code,
        )
        .order_by(Assignment.input_month)
        .all()
    )
    if not assignments:
        raise HTTPException(status_code=404, detail="배치 정보를 찾을 수 없습니다")
    return assignments


def get_by_key(db: Session, employee_id: str, project_code: str, input_month: str) -> Assignment:
    assignment = db.query(Assignment).filter(
        Assignment.employee_id == employee_id,
        Assignment.project_code == project_code,
        Assignment.input_month == input_month,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="배치 정보를 찾을 수 없습니다")
    return assignment


def update(
    db: Session,
    employee_id: str,
    project_code: str,
    input_month: str,
    data: AssignmentUpdate,
    changed_by: str,
) -> Assignment:
    assignment = get_by_key(db, employee_id, project_code, input_month)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    update_data = data.model_dump(exclude_unset=True)
    old_snap: dict = {}
    new_snap: dict = {}

    for field, new_val in update_data.items():
        old_val = getattr(assignment, field)
        if old_val != new_val:
            old_snap[field] = str(old_val) if old_val is not None else None
            new_snap[field] = str(new_val) if new_val is not None else None
            setattr(assignment, field, new_val)

    if old_snap:
        if 'input_manpower' in new_snap:
            check_conflict(
                db, employee_id, [input_month], float(new_snap['input_manpower']),
                exclude_project=project_code,
            )
        _record_history(db, employee_id, project_code, input_month, "UPDATE", old_snap, new_snap, changed_by, now)

    db.commit()
    db.refresh(assignment)
    return assignment


def delete(db: Session, employee_id: str, project_code: str, changed_by: str) -> None:
    assignments = get_by_emp_proj(db, employee_id, project_code)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for assignment in assignments:
        old_values = {
            "employee_id": assignment.employee_id,
            "project_code": assignment.project_code,
            "input_month": assignment.input_month,
            "input_manpower": str(assignment.input_manpower),
        }
        _record_history(db, employee_id, project_code, assignment.input_month, "DELETE", old_values, None, changed_by, now)
        db.delete(assignment)

    db.commit()


def get_history(db: Session, employee_id: str, project_code: str) -> list[AssignmentHistory]:
    return (
        db.query(AssignmentHistory)
        .filter(
            AssignmentHistory.employee_id == employee_id,
            AssignmentHistory.project_code == project_code,
        )
        .order_by(AssignmentHistory.changed_at.desc())
        .all()
    )
