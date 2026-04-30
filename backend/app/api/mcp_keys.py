import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.member import McpApiKeyResponse, McpUsageHistoryResponse
from app.api.deps import get_current_user
from app.models.member import Member
from app.models.mcp import McpApiKey, McpUsageHistory

router = APIRouter()


@router.post("/apikey/", response_model=McpApiKeyResponse)
def create_api_key(
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> McpApiKeyResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Deactivate existing key if present
    existing = db.query(McpApiKey).filter(
        McpApiKey.member_id == current_user.username
    ).first()
    if existing:
        existing.is_active = False
        db.flush()

    new_key = McpApiKey(
        member_id=current_user.username,
        api_key=str(uuid.uuid4()),
        created_at=now,
        is_active=True,
        last_used_at=None,
    )

    if existing:
        db.delete(existing)
        db.flush()

    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return McpApiKeyResponse(
        member_id=new_key.member_id,
        api_key=new_key.api_key,
        created_at=str(new_key.created_at),
        is_active=new_key.is_active,
        last_used_at=str(new_key.last_used_at) if new_key.last_used_at else None,
    )


@router.get("/apikey/", response_model=McpApiKeyResponse)
def get_api_key(
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> McpApiKeyResponse:
    key = db.query(McpApiKey).filter(
        McpApiKey.member_id == current_user.username
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API 키가 없습니다")

    return McpApiKeyResponse(
        member_id=key.member_id,
        api_key=key.api_key,
        created_at=str(key.created_at),
        is_active=key.is_active,
        last_used_at=str(key.last_used_at) if key.last_used_at else None,
    )


@router.delete("/apikey/", status_code=204)
def deactivate_api_key(
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> None:
    key = db.query(McpApiKey).filter(
        McpApiKey.member_id == current_user.username
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API 키가 없습니다")

    key.is_active = False
    db.commit()


@router.get("/apikey/history/", response_model=list[McpUsageHistoryResponse])
def get_api_key_history(
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
) -> list[McpUsageHistoryResponse]:
    history = (
        db.query(McpUsageHistory)
        .filter(McpUsageHistory.employee_id == current_user.username)
        .order_by(McpUsageHistory.used_at.desc())
        .all()
    )
    return [
        McpUsageHistoryResponse(
            id=h.id,
            used_at=str(h.used_at),
            employee_id=h.employee_id,
            tool_name=h.tool_name,
            request_content=h.request_content,
            response_status=h.response_status,
        )
        for h in history
    ]
