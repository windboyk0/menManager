from sqlalchemy import Column, String, Integer, Date, DateTime, Text
from app.db.database import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    career_years = Column(Integer, nullable=False)
    grade = Column(String, nullable=False)  # 특급/고급/중급/초급
    join_date = Column(Date, nullable=False)
    position = Column(String, nullable=False)
    title = Column(String, nullable=False)


class EmployeeHistory(Base):
    __tablename__ = "employee_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    changed_at = Column(DateTime, nullable=False)
    employee_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # INSERT/UPDATE/DELETE
    old_values = Column(Text, nullable=True)  # JSON, null for INSERT
    new_values = Column(Text, nullable=True)  # JSON, null for DELETE
    changed_by = Column(String, nullable=False)
