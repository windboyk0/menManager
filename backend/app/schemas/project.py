from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date
from typing import Optional, Literal, Any
from decimal import Decimal, ROUND_HALF_UP
import json


def _round2(v: float) -> float:
    return float(Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


class ProjectBase(BaseModel):
    client: str
    project_name: str
    start_date: date
    end_date: date
    status: Literal["진행중", "완료", "대기", "취소"]
    inspection_date: Optional[date] = None
    total_manpower: float
    contract_amount: int
    senior_manpower: float
    advanced_manpower: float
    intermediate_manpower: float
    junior_manpower: float

    @field_validator('total_manpower', 'senior_manpower', 'advanced_manpower',
                     'intermediate_manpower', 'junior_manpower')
    @classmethod
    def round_manpower(cls, v: float) -> float:
        return _round2(v)


class ProjectCreate(ProjectBase):
    project_code: str


class ProjectUpdate(BaseModel):
    client: Optional[str] = None
    project_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[Literal["진행중", "완료", "대기", "취소"]] = None
    inspection_date: Optional[date] = None
    total_manpower: Optional[float] = None
    contract_amount: Optional[int] = None
    senior_manpower: Optional[float] = None
    advanced_manpower: Optional[float] = None
    intermediate_manpower: Optional[float] = None
    junior_manpower: Optional[float] = None

    @field_validator('total_manpower', 'senior_manpower', 'advanced_manpower',
                     'intermediate_manpower', 'junior_manpower', mode='before')
    @classmethod
    def round_manpower(cls, v: Optional[float]) -> Optional[float]:
        return _round2(v) if v is not None else v


class ProjectResponse(ProjectBase):
    project_code: str
    model_config = ConfigDict(from_attributes=True)


class ProjectHistoryResponse(BaseModel):
    id: int
    changed_at: str
    project_code: str
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
