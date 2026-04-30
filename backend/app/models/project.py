from sqlalchemy import Column, String, Date, BigInteger, Integer, DateTime, Text, Numeric
from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    project_code = Column(String, primary_key=True, index=True)
    client = Column(String, nullable=False)
    project_name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # 진행중/완료/대기/취소
    inspection_date = Column(Date, nullable=True)
    total_manpower = Column(Numeric(10, 2), nullable=False)
    contract_amount = Column(BigInteger, nullable=False)
    senior_manpower = Column(Numeric(10, 2), nullable=False)
    advanced_manpower = Column(Numeric(10, 2), nullable=False)
    intermediate_manpower = Column(Numeric(10, 2), nullable=False)
    junior_manpower = Column(Numeric(10, 2), nullable=False)


class ProjectHistory(Base):
    __tablename__ = "project_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    changed_at = Column(DateTime, nullable=False)
    project_code = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # INSERT/UPDATE/DELETE
    old_values = Column(Text, nullable=True)  # JSON, null for INSERT
    new_values = Column(Text, nullable=True)  # JSON, null for DELETE
    changed_by = Column(String, nullable=False)
