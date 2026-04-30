from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from app.db.database import Base


class McpApiKey(Base):
    __tablename__ = "mcp_api_keys"

    member_id = Column(String, primary_key=True)
    api_key = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    last_used_at = Column(DateTime, nullable=True)


class McpUsageHistory(Base):
    __tablename__ = "mcp_usage_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    used_at = Column(DateTime, nullable=False)
    employee_id = Column(String, nullable=False)
    tool_name = Column(String, nullable=False)
    request_content = Column(Text, nullable=False)
    response_status = Column(String, nullable=False)  # success/error
