from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserInfo, PasswordChangeRequest
from app.api.deps import get_current_user
from app.models.member import Member
import app.services.auth as auth_service

router = APIRouter()


@router.post("/register/", response_model=UserInfo)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserInfo:
    member = auth_service.register(db, data)
    return UserInfo(
        employee_id=member.employee_id,
        username=member.username,
        role=member.role,
    )


@router.post("/login/", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    token = auth_service.login(db, data.username, data.password)
    return TokenResponse(access_token=token)


@router.post("/token/", response_model=TokenResponse)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """OAuth2 compatible token endpoint for form-based login."""
    token = auth_service.login(db, form_data.username, form_data.password)
    return TokenResponse(access_token=token)


@router.get("/me/", response_model=UserInfo)
def get_me(
    current_user: Member = Depends(get_current_user),
) -> UserInfo:
    return UserInfo(
        employee_id=current_user.employee_id,
        username=current_user.username,
        role=current_user.role,
    )


@router.put("/update/{employee_id}/updatePW/", status_code=200)
def change_password(
    employee_id: str,
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> dict:
    if current_user.employee_id != employee_id and current_user.role != "관리자":
        raise HTTPException(status_code=403, detail="권한이 없습니다")
    auth_service.change_password(db, employee_id, data.current_password, data.new_password)
    return {"message": "비밀번호가 변경되었습니다"}
