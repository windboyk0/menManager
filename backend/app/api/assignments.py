from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentHistoryResponse,
)
from app.api.deps import get_current_user, require_admin
from app.models.member import Member
import app.services.assignment as assignment_service

router = APIRouter()


@router.post("/", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> AssignmentResponse:
    return assignment_service.create(db, data, changed_by=current_user.employee_id)


@router.get("/", response_model=list[AssignmentResponse])
def list_assignments(
    employee_id: Optional[str] = Query(None),
    project_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[AssignmentResponse]:
    return assignment_service.get_all(db, employee_id=employee_id, project_code=project_code)


@router.get("/{emp_id}/{proj_code}/", response_model=list[AssignmentResponse])
def get_assignment(
    emp_id: str,
    proj_code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[AssignmentResponse]:
    return assignment_service.get_by_emp_proj(db, emp_id, proj_code)


@router.put("/{emp_id}/{proj_code}/{month}/", response_model=AssignmentResponse)
def update_assignment(
    emp_id: str,
    proj_code: str,
    month: str,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> AssignmentResponse:
    return assignment_service.update(db, emp_id, proj_code, month, data, changed_by=current_user.employee_id)


@router.delete("/{emp_id}/{proj_code}/", status_code=204)
def delete_assignment(
    emp_id: str,
    proj_code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> None:
    assignment_service.delete(db, emp_id, proj_code, changed_by=current_user.employee_id)


@router.get("/{emp_id}/{proj_code}/history/", response_model=list[AssignmentHistoryResponse])
def get_assignment_history(
    emp_id: str,
    proj_code: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[AssignmentHistoryResponse]:
    history = assignment_service.get_history(db, emp_id, proj_code)
    return [
        AssignmentHistoryResponse(
            id=h.id,
            changed_at=str(h.changed_at),
            employee_id=h.employee_id,
            project_code=h.project_code,
            input_month=h.input_month,
            event_type=h.event_type,
            old_values=h.old_values,
            new_values=h.new_values,
            changed_by=h.changed_by,
        )
        for h in history
    ]
