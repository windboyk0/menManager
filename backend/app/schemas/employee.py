from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date
from typing import Optional, Literal, Any
import json


class EmployeeBase(BaseModel):
    name: str
    career_years: int
    grade: Literal["특급", "고급", "중급", "초급"]
    join_date: date
    position: str
    title: str


class EmployeeCreate(EmployeeBase):
    employee_id: str


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    career_years: Optional[int] = None
    grade: Optional[Literal["특급", "고급", "중급", "초급"]] = None
    join_date: Optional[date] = None
    position: Optional[str] = None
    title: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    employee_id: str
    model_config = ConfigDict(from_attributes=True)


class EmployeeHistoryResponse(BaseModel):
    id: int
    changed_at: str
    employee_id: str
    event_type: str
    old_values: Optional[dict[str, Any]] = None
    new_values: Optional[dict[str, Any]] = None
    changed_by: str
    model_config = ConfigDict(from_attributes=True)

    @field_validator('old_values', 'new_values', mode='before')
    @classmethod
    def parse_json(cls, v: Any) -> Any:
        if isinstance(v, str):
            return json.loads(v)
        return v
