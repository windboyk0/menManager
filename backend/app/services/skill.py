from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillUpdate


def create(db: Session, data: SkillCreate) -> Skill:
    skill = Skill(
        skill_name=data.skill_name,
        category=data.category,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def get_all(db: Session, category: Optional[str] = None) -> list[Skill]:
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category == category)
    return query.all()


def get_by_id(db: Session, skill_id: int) -> Skill:
    skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="스킬을 찾을 수 없습니다")
    return skill


def update(db: Session, skill_id: int, data: SkillUpdate) -> Skill:
    skill = get_by_id(db, skill_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)
    return skill


def delete(db: Session, skill_id: int) -> None:
    skill = get_by_id(db, skill_id)
    db.delete(skill)
    db.commit()
