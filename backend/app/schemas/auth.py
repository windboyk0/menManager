from pydantic import BaseModel
from datetime import date
from typing import Literal


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    employee_id: str
    name: str
    career_years: int
    grade: Literal["특급", "고급", "중급", "초급"]
    join_date: date
    position: str
    title: str
    username: str
    password: str
    role: Literal["관리자", "일반"] = "일반"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserInfo(BaseModel):
    employee_id: str
    username: str
    role: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
