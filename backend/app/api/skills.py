from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse
from app.api.deps import get_current_user, require_admin
from app.models.member import Member
import app.services.skill as skill_service

router = APIRouter()


@router.post("/", response_model=SkillResponse, status_code=201)
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> SkillResponse:
    return skill_service.create(db, data)


@router.get("/", response_model=list[SkillResponse])
def list_skills(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[SkillResponse]:
    return skill_service.get_all(db, category=category)


@router.put("/{skill_id}/", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> SkillResponse:
    return skill_service.update(db, skill_id, data)


@router.delete("/{skill_id}/", status_code=204)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
) -> None:
    skill_service.delete(db, skill_id)
