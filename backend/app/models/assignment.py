from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Numeric
from app.db.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    employee_id = Column(String, ForeignKey("employees.employee_id"), primary_key=True)
    project_code = Column(String, ForeignKey("projects.project_code"), primary_key=True)
    input_month = Column(String, primary_key=True)  # YYYY-MM
    input_manpower = Column(Numeric(4, 2), nullable=False)  # 0.01 ~ 1.00


class AssignmentHistory(Base):
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    changed_at = Column(DateTime, nullable=False)
    employee_id = Column(String, nullable=False)
    project_code = Column(String, nullable=False)
    input_month = Column(String, nullable=False)  # YYYY-MM
    event_type = Column(String, nullable=False)  # INSERT/UPDATE/DELETE
    old_values = Column(Text, nullable=True)  # JSON, null for INSERT
    new_values = Column(Text, nullable=True)  # JSON, null for DELETE
    changed_by = Column(String, nullable=False)
