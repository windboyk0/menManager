import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, StaticPool
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite with StaticPool so all connections share the same DB
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def set_test_sqlite_pragma(dbapi_connection, connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def client():
    """Create a test client with a fresh in-memory database."""
    from app.db.database import Base, get_db
    from app.main import app

    # Create all tables on the test engine
    Base.metadata.create_all(bind=test_engine)

    # Override the DB dependency
    app.dependency_overrides[get_db] = override_get_db

    # Seed test data using the test DB
    _seed_test_data()

    # Prevent startup from running seed_data on the real DB
    # (the startup event fires when TestClient enters, but we've already seeded)
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="session")
def admin_token(client: TestClient) -> str:
    """Get admin JWT token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


def _seed_test_data() -> None:
    """Seed minimal test data into the in-memory DB."""
    from datetime import date, datetime, timezone
    from passlib.context import CryptContext
    from app.models.employee import Employee
    from app.models.member import Member
    from app.models.project import Project
    from app.models.skill import Skill, EmployeeSkill
    from app.models.assignment import Assignment

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db = TestSessionLocal()
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    try:
        # Employees
        employees = [
            Employee(employee_id="EMP001", name="관리자",   career_years=15, grade="특급", join_date=date(2009, 3, 1), position="부장", title="부서장"),
            Employee(employee_id="EMP002", name="김철수",   career_years=12, grade="특급", join_date=date(2012, 3, 1), position="부장", title="팀장"),
            Employee(employee_id="EMP003", name="이영희",   career_years=10, grade="고급", join_date=date(2014, 5, 1), position="차장", title="팀장"),
            Employee(employee_id="EMP004", name="박민준",   career_years=8,  grade="고급", join_date=date(2016, 9, 1), position="과장", title="팀원"),
            Employee(employee_id="EMP005", name="최수진",   career_years=6,  grade="중급", join_date=date(2018, 3, 1), position="대리", title="팀원"),
            Employee(employee_id="EMP006", name="정대호",   career_years=5,  grade="중급", join_date=date(2019, 1, 1), position="대리", title="팀원"),
            Employee(employee_id="EMP007", name="강민서",   career_years=4,  grade="중급", join_date=date(2020, 6, 1), position="사원", title="팀원"),
            Employee(employee_id="EMP008", name="윤지현",   career_years=3,  grade="초급", join_date=date(2021, 3, 1), position="사원", title="팀원"),
            Employee(employee_id="EMP099", name="테스트사원", career_years=1, grade="초급", join_date=date(2024, 1, 1), position="사원", title="팀원"),
        ]
        for e in employees:
            db.add(e)
        db.flush()

        # Admin member
        db.add(Member(
            employee_id="EMP001",
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            role="관리자",
            created_at=now,
        ))
        db.flush()

        # Projects
        projects = [
            Project(
                project_code="PRJ001", client="국민은행", project_name="차세대 뱅킹 시스템",
                start_date=date(2025, 1, 1), end_date=date(2025, 12, 31), status="진행중",
                total_manpower=120.0, contract_amount=5000000000,
                senior_manpower=30.0, advanced_manpower=40.0, intermediate_manpower=30.0, junior_manpower=20.0,
            ),
            Project(
                project_code="PRJ002", client="행정안전부", project_name="전자정부 포털 고도화",
                start_date=date(2025, 3, 1), end_date=date(2025, 11, 30), status="진행중",
                total_manpower=80.0, contract_amount=3200000000,
                senior_manpower=20.0, advanced_manpower=25.0, intermediate_manpower=20.0, junior_manpower=15.0,
            ),
            Project(
                project_code="PRJ999", client="테스트고객", project_name="테스트 프로젝트",
                start_date=date(2025, 1, 1), end_date=date(2025, 12, 31), status="대기",
                total_manpower=10.0, contract_amount=100000000,
                senior_manpower=2.0, advanced_manpower=3.0, intermediate_manpower=3.0, junior_manpower=2.0,
            ),
        ]
        for p in projects:
            db.add(p)
        db.flush()

        # Skills
        skills = [
            Skill(skill_id=1, skill_name="Java",        category="백엔드"),
            Skill(skill_id=2, skill_name="Python",       category="백엔드"),
            Skill(skill_id=3, skill_name="React",        category="프론트엔드"),
            Skill(skill_id=4, skill_name="Spring Boot",  category="백엔드"),
        ]
        for s in skills:
            db.add(s)
        db.flush()

        # Employee Skills
        emp_skills = [
            EmployeeSkill(employee_id="EMP002", skill_id=1, proficiency=5),
            EmployeeSkill(employee_id="EMP002", skill_id=4, proficiency=5),
            EmployeeSkill(employee_id="EMP003", skill_id=2, proficiency=5),
            EmployeeSkill(employee_id="EMP004", skill_id=1, proficiency=4),
            EmployeeSkill(employee_id="EMP004", skill_id=4, proficiency=4),
            EmployeeSkill(employee_id="EMP005", skill_id=3, proficiency=4),
        ]
        for es in emp_skills:
            db.add(es)
        db.flush()

        # Assignments (non-conflicting)
        assignments = [
            # EMP003 is fully booked Jan-Jun 2025 (manpower=1.0)
            Assignment(employee_id="EMP003", project_code="PRJ001", actual_start_date=date(2025, 1, 1), actual_end_date=date(2025, 6, 30), actual_manpower=1.0),
            # EMP004 has 0.6 on PRJ001 all year
            Assignment(employee_id="EMP004", project_code="PRJ001", actual_start_date=date(2025, 1, 1), actual_end_date=date(2025, 12, 31), actual_manpower=0.6),
            # EMP005 fully booked Mar-Nov 2025
            Assignment(employee_id="EMP005", project_code="PRJ002", actual_start_date=date(2025, 3, 1), actual_end_date=date(2025, 11, 30), actual_manpower=1.0),
            # EMP006 half-time on PRJ001 Jan-Jun
            Assignment(employee_id="EMP006", project_code="PRJ001", actual_start_date=date(2025, 1, 1), actual_end_date=date(2025, 6, 30), actual_manpower=0.5),
            # EMP008 half-time on PRJ002 Mar-Sep
            Assignment(employee_id="EMP008", project_code="PRJ002", actual_start_date=date(2025, 3, 1), actual_end_date=date(2025, 9, 30), actual_manpower=0.5),
        ]
        for a in assignments:
            db.add(a)
        db.flush()

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
