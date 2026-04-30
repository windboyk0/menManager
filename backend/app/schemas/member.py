from pydantic import BaseModel, ConfigDict
from typing import Optional


class McpApiKeyResponse(BaseModel):
    member_id: str
    api_key: str
    created_at: str
    is_active: bool
    last_used_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class McpUsageHistoryResponse(BaseModel):
    id: int
    used_at: str
    employee_id: str
    tool_name: str
    request_content: str
    response_status: str
    model_config = ConfigDict(from_attributes=True)
