import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.project import Project, ProjectHistory
from app.schemas.project import ProjectCreate, ProjectUpdate


def _record_history(
    db: Session,
    project_code: str,
    event_type: str,
    old_values: dict | None,
    new_values: dict | None,
    changed_by: str,
    now: datetime,
) -> None:
    db.add(ProjectHistory(
        changed_at=now,
        project_code=project_code,
        event_type=event_type,
        old_values=json.dumps(old_values, ensure_ascii=False) if old_values is not None else None,
        new_values=json.dumps(new_values, ensure_ascii=False) if new_values is not None else None,
        changed_by=changed_by,
    ))


def create(db: Session, data: ProjectCreate, changed_by: str) -> Project:
    existing = db.query(Project).filter(Project.project_code == data.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 프로젝트 코드입니다")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    project = Project(
        project_code=data.project_code,
        client=data.client,
        project_name=data.project_name,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status,
        inspection_date=data.inspection_date,
        total_manpower=data.total_manpower,
        contract_amount=data.contract_amount,
        senior_manpower=data.senior_manpower,
        advanced_manpower=data.advanced_manpower,
        intermediate_manpower=data.intermediate_manpower,
        junior_manpower=data.junior_manpower,
    )
    db.add(project)
    db.flush()

    new_values = {
        "project_code": str(data.project_code),
        "client": str(data.client),
        "project_name": str(data.project_name),
        "start_date": str(data.start_date),
        "end_date": str(data.end_date),
        "status": str(data.status),
        "inspection_date": str(data.inspection_date) if data.inspection_date else None,
        "total_manpower": str(data.total_manpower),
        "contract_amount": str(data.contract_amount),
        "senior_manpower": str(data.senior_manpower),
        "advanced_manpower": str(data.advanced_manpower),
        "intermediate_manpower": str(data.intermediate_manpower),
        "junior_manpower": str(data.junior_manpower),
    }
    _record_history(db, data.project_code, "INSERT", None, new_values, changed_by, now)

    db.commit()
    db.refresh(project)
    return project


def get_all(
    db: Session,
    status: Optional[str] = None,
    client: Optional[str] = None,
) -> list[Project]:
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    if client:
        query = query.filter(Project.client.contains(client))
    return query.all()


def get_by_code(db: Session, code: str) -> Project:
    project = db.query(Project).filter(Project.project_code == code).first()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    return project


def update(db: Session, code: str, data: ProjectUpdate, changed_by: str) -> Project:
    project = get_by_code(db, code)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    update_data = data.model_dump(exclude_unset=True)
    old_snap: dict = {}
    new_snap: dict = {}

    for field, new_val in update_data.items():
        old_val = getattr(project, field)
        if old_val != new_val:
            old_snap[field] = str(old_val) if old_val is not None else None
            new_snap[field] = str(new_val) if new_val is not None else None
            setattr(project, field, new_val)

    if old_snap:
        _record_history(db, code, "UPDATE", old_snap, new_snap, changed_by, now)

    db.commit()
    db.refresh(project)
    return project


def delete(db: Session, code: str, changed_by: str) -> None:
    project = get_by_code(db, code)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    old_values = {
        "project_code": str(project.project_code),
        "client": str(project.client),
        "project_name": str(project.project_name),
        "start_date": str(project.start_date),
        "end_date": str(project.end_date),
        "status": str(project.status),
        "inspection_date": str(project.inspection_date) if project.inspection_date else None,
        "total_manpower": str(project.total_manpower),
        "contract_amount": str(project.contract_amount),
        "senior_manpower": str(project.senior_manpower),
        "advanced_manpower": str(project.advanced_manpower),
        "intermediate_manpower": str(project.intermediate_manpower),
        "junior_manpower": str(project.junior_manpower),
    }
    _record_history(db, code, "DELETE", old_values, None, changed_by, now)

    db.delete(project)
    db.commit()


def get_history(db: Session, code: str) -> list[ProjectHistory]:
    return (
        db.query(ProjectHistory)
        .filter(ProjectHistory.project_code == code)
        .order_by(ProjectHistory.changed_at.desc())
        .all()
    )
