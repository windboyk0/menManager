from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any
from decimal import Decimal, ROUND_HALF_UP
import json


def _round2(v: float) -> float:
    return float(Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


class AssignmentCreate(BaseModel):
    employee_id: str
    project_code: str
    input_month: str   # YYYY-MM
    input_manpower: float

    @field_validator('input_manpower')
    @classmethod
    def round_manpower(cls, v: float) -> float:
        return _round2(v)


class AssignmentUpdate(BaseModel):
    input_manpower: Optional[float] = None

    @field_validator('input_manpower', mode='before')
    @classmethod
    def round_manpower(cls, v: Optional[float]) -> Optional[float]:
        return _round2(v) if v is not None else v


class AssignmentResponse(BaseModel):
    employee_id: str
    project_code: str
    input_month: str
    input_manpower: float
    model_config = ConfigDict(from_attributes=True)


class AssignmentHistoryResponse(BaseModel):
    id: int
    changed_at: str
    employee_id: str
    project_code: str
    input_month: str
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
