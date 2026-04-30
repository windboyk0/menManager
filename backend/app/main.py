import warnings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.db.database import engine
from app.db import init_db
from app.models import Base
from app.api import auth, projects, employees, assignments, skills, mcp_keys


def _migrate_history_tables() -> None:
    """Drop history tables if they have the old field-level schema (changed_field column)."""
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(employee_history)"))
        columns = [row[1] for row in result]
        if "changed_field" in columns:
            conn.execute(text("DROP TABLE IF EXISTS employee_history"))
            conn.execute(text("DROP TABLE IF EXISTS project_history"))
            conn.execute(text("DROP TABLE IF EXISTS assignment_history"))
            conn.execute(text("DROP TABLE IF EXISTS member_history"))
            conn.commit()


def _migrate_assignment_table() -> None:
    """Drop assignment tables if they contain actual_start_date (removed from schema)."""
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(assignments)"))
        col_names = [row[1] for row in result]
        if "actual_start_date" in col_names:
            conn.execute(text("DROP TABLE IF EXISTS assignments"))
            conn.execute(text("DROP TABLE IF EXISTS assignment_history"))
            conn.commit()

# Suppress deprecation warning for on_event
warnings.filterwarnings("ignore", category=DeprecationWarning)

app = FastAPI(
    title="인력 관리 시스템 API",
    version="1.0.0",
    description="Personnel Management System REST API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    _migrate_history_tables()
    _migrate_assignment_table()
    Base.metadata.create_all(bind=engine)
    init_db.seed_data()


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["employees"])
app.include_router(assignments.router, prefix="/api/v1/assignments", tags=["assignments"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(mcp_keys.router, prefix="/api/v1/mcp", tags=["mcp"])


@app.get("/")
async def root() -> dict:
    return {"message": "인력 관리 시스템 API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
