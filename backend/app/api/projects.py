from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectHistoryResponse,
)
from app.api.deps import get_current_user, require_admin
from app.models.member import Member
import app.services.project as project_service

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> ProjectResponse:
    project = project_service.create(db, data, changed_by=current_user.employee_id)
    return project


@router.get("/", response_model=list[ProjectResponse])
def list_projects(
    status: Optional[str] = Query(None),
    client: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[ProjectResponse]:
    return project_service.get_all(db, status=status, client=client)


@router.get("/{code}/", response_model=ProjectResponse)
def get_project(
    code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> ProjectResponse:
    return project_service.get_by_code(db, code)


@router.put("/{code}/", response_model=ProjectResponse)
def update_project(
    code: str,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> ProjectResponse:
    return project_service.update(db, code, data, changed_by=current_user.employee_id)


@router.delete("/{code}/", status_code=204)
def delete_project(
    code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> None:
    project_service.delete(db, code, changed_by=current_user.employee_id)


@router.get("/{code}/history/", response_model=list[ProjectHistoryResponse])
def get_project_history(
    code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[ProjectHistoryResponse]:
    history = project_service.get_history(db, code)
    return [
        ProjectHistoryResponse(
            id=h.id,
            changed_at=str(h.changed_at),
            project_code=h.project_code,
            event_type=h.event_type,
            old_values=h.old_values,
            new_values=h.new_values,
            changed_by=h.changed_by,
        )
        for h in history
    ]
