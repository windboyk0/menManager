from sqlalchemy import Column, String, Integer, ForeignKey
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    skill_name = Column(String, nullable=False)
    category = Column(String, nullable=False)


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    employee_id = Column(String, ForeignKey("employees.employee_id"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.skill_id"), primary_key=True)
    proficiency = Column(Integer, nullable=False)  # 1~5
