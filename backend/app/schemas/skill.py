from pydantic import BaseModel, ConfigDict
from typing import Optional


class SkillCreate(BaseModel):
    skill_name: str
    category: str


class SkillUpdate(BaseModel):
    skill_name: Optional[str] = None
    category: Optional[str] = None


class SkillResponse(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    model_config = ConfigDict(from_attributes=True)


class EmployeeSkillCreate(BaseModel):
    skill_id: int
    proficiency: int  # 1~5


class EmployeeSkillUpdate(BaseModel):
    proficiency: int


class EmployeeSkillResponse(BaseModel):
    employee_id: str
    skill_id: int
    proficiency: int
    skill_name: str
    category: str
    model_config = ConfigDict(from_attributes=True)
