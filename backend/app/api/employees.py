from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeHistoryResponse,
)
from app.schemas.skill import (
    EmployeeSkillCreate,
    EmployeeSkillUpdate,
    EmployeeSkillResponse,
)
from app.api.deps import get_current_user, require_admin
from app.models.member import Member
import app.services.employee as employee_service

router = APIRouter()


@router.post("/", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> EmployeeResponse:
    return employee_service.create(db, data, changed_by=current_user.employee_id)


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(
    grade: Optional[str] = Query(None),
    available_from: Optional[date] = Query(None),
    available_to: Optional[date] = Query(None),
    skill_ids: Optional[list[int]] = Query(None),
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[EmployeeResponse]:
    return employee_service.get_all(
        db,
        grade=grade,
        available_from=available_from,
        available_to=available_to,
        skill_ids=skill_ids,
    )


@router.get("/{employee_id}/", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> EmployeeResponse:
    return employee_service.get_by_id(db, employee_id)


@router.put("/{employee_id}/", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> EmployeeResponse:
    return employee_service.update(db, employee_id, data, changed_by=current_user.employee_id)


@router.delete("/{employee_id}/", status_code=204)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> None:
    employee_service.delete(db, employee_id, changed_by=current_user.employee_id)


@router.get("/{employee_id}/history/", response_model=list[EmployeeHistoryResponse])
def get_employee_history(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[EmployeeHistoryResponse]:
    history = employee_service.get_history(db, employee_id)
    return [
        EmployeeHistoryResponse(
            id=h.id,
            changed_at=str(h.changed_at),
            employee_id=h.employee_id,
            event_type=h.event_type,
            old_values=h.old_values,
            new_values=h.new_values,
            changed_by=h.changed_by,
        )
        for h in history
    ]


@router.post("/{employee_id}/skills/", response_model=EmployeeSkillResponse, status_code=201)
def add_employee_skill(
    employee_id: str,
    data: EmployeeSkillCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> EmployeeSkillResponse:
    from app.models.skill import Skill
    emp_skill = employee_service.add_skill(db, employee_id, data)
    skill = db.query(Skill).filter(Skill.skill_id == emp_skill.skill_id).first()
    return EmployeeSkillResponse(
        employee_id=emp_skill.employee_id,
        skill_id=emp_skill.skill_id,
        proficiency=emp_skill.proficiency,
        skill_name=skill.skill_name if skill else "",
        category=skill.category if skill else "",
    )


@router.get("/{employee_id}/skills/", response_model=list[EmployeeSkillResponse])
def get_employee_skills(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[EmployeeSkillResponse]:
    skills = employee_service.get_skills(db, employee_id)
    return [EmployeeSkillResponse(**s) for s in skills]


@router.put("/{employee_id}/skills/{skill_id}/", response_model=EmployeeSkillResponse)
def update_employee_skill(
    employee_id: str,
    skill_id: int,
    data: EmployeeSkillUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> EmployeeSkillResponse:
    result = employee_service.update_skill(db, employee_id, skill_id, data)
    return EmployeeSkillResponse(**result)


@router.delete("/{employee_id}/skills/{skill_id}/", status_code=204)
def delete_employee_skill(
    employee_id: str,
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> None:
    employee_service.delete_skill(db, employee_id, skill_id)
