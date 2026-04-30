"""
MCP Server — 인력 관리 시스템 (조회 전용)

전송 방식: STDIO (현재)
인증: 환경변수 MCP_API_KEY

향후 Streamable HTTP 전환 예시:
  from mcp.server.fastmcp import FastMCP
  mcp = FastMCP("인력관리", stateless_http=True)
  # uvicorn app.mcp.server:mcp.streamable_http_app() --port 8001
"""

import os
import sys
import json
from datetime import date, datetime

from mcp.server.fastmcp import FastMCP
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# ── DB 연결 ──────────────────────────────────────────────
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent.parent  # menManager/
DB_URL = f"sqlite:///{BASE_DIR / 'database' / 'menManager.db'}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

from sqlalchemy import event as sa_event

@sa_event.listens_for(engine, "connect")
def _wal(conn, _rec):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()

SessionLocal = sessionmaker(bind=engine)

# ── MCP 앱 ──────────────────────────────────────────────
mcp = FastMCP("인력관리시스템")

# ── API Key 인증 + 사용이력 기록 헬퍼 ───────────────────
def _get_db() -> Session:
    return SessionLocal()


def _auth_and_log(db: Session, tool_name: str, request_content: str) -> str:
    """API Key 검증 후 employee_id 반환. 실패 시 예외."""
    from app.models.mcp import McpApiKey, McpUsageHistory

    api_key = os.environ.get("MCP_API_KEY", "")
    key_row = (
        db.query(McpApiKey)
        .filter(McpApiKey.api_key == api_key, McpApiKey.is_active.is_(True))
        .first()
    )

    status = "success" if key_row else "error"
    db.add(McpUsageHistory(
        used_at=datetime.utcnow(),
        employee_id=key_row.employee_id if key_row else "UNKNOWN",
        tool_name=tool_name,
        request_content=request_content,
        response_status=status,
    ))
    if key_row:
        key_row.last_used_at = datetime.utcnow()
    db.commit()

    if not key_row:
        raise PermissionError("Invalid or inactive API key. Set MCP_API_KEY environment variable.")
    return key_row.employee_id


# ── Tool 1: 특정 프로젝트 배치 인원 조회 ────────────────
@mcp.tool()
def get_project_assignments(project_code: str) -> str:
    """특정 프로젝트에 배치된 인원 목록을 반환합니다."""
    from app.models.assignment import Assignment
    from app.models.employee import Employee

    db = _get_db()
    try:
        _auth_and_log(db, "get_project_assignments", f"project_code={project_code}")
        rows = (
            db.query(Assignment, Employee)
            .join(Employee, Assignment.employee_id == Employee.employee_id)
            .filter(Assignment.project_code == project_code)
            .all()
        )
        result = [
            {
                "employee_id": a.employee_id,
                "name": e.name,
                "grade": e.grade,
                "actual_start_date": str(a.actual_start_date),
                "actual_end_date": str(a.actual_end_date),
                "actual_manpower_pct": round(a.actual_manpower * 100, 1),
            }
            for a, e in rows
        ]
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 2: 특정 기간 가용 직원 조회 ────────────────────
@mcp.tool()
def get_available_employees(start_date: str, end_date: str, min_availability: float = 0.0) -> str:
    """특정 기간에 배치 가능한 직원(배치율 합계 < 100%)을 반환합니다.
    min_availability: 최소 가용율 (0.0~1.0, 기본 0.0)
    """
    from app.models.employee import Employee
    from app.models.assignment import Assignment
    from sqlalchemy import and_, or_

    db = _get_db()
    try:
        _auth_and_log(db, "get_available_employees", f"start={start_date}, end={end_date}")
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)

        all_employees = db.query(Employee).all()
        result = []
        for emp in all_employees:
            overlapping = (
                db.query(Assignment)
                .filter(
                    Assignment.employee_id == emp.employee_id,
                    Assignment.actual_start_date <= ed,
                    Assignment.actual_end_date >= sd,
                )
                .all()
            )
            total = sum(a.actual_manpower for a in overlapping)
            available_rate = round(1.0 - total, 3)
            if available_rate >= min_availability:
                result.append({
                    "employee_id": emp.employee_id,
                    "name": emp.name,
                    "grade": emp.grade,
                    "available_rate_pct": round(available_rate * 100, 1),
                })
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 3: 직원 스킬 기반 검색 ──────────────────────────
@mcp.tool()
def search_employees_by_skill(skill_ids: list[int], min_proficiency: int = 1) -> str:
    """지정 스킬을 모두 보유한 직원을 검색합니다.
    skill_ids: 스킬 ID 목록 (AND 조건)
    min_proficiency: 최소 숙련도 1~5
    """
    from app.models.employee import Employee
    from app.models.skill import EmployeeSkill, Skill
    from sqlalchemy import func

    db = _get_db()
    try:
        _auth_and_log(db, "search_employees_by_skill", f"skill_ids={skill_ids}, min={min_proficiency}")

        # 모든 지정 스킬을 최소 숙련도 이상으로 보유한 직원
        matching_ids = (
            db.query(EmployeeSkill.employee_id)
            .filter(
                EmployeeSkill.skill_id.in_(skill_ids),
                EmployeeSkill.proficiency >= min_proficiency,
            )
            .group_by(EmployeeSkill.employee_id)
            .having(func.count(EmployeeSkill.skill_id) == len(skill_ids))
            .subquery()
        )

        employees = (
            db.query(Employee)
            .filter(Employee.employee_id.in_(matching_ids))
            .all()
        )

        result = []
        for emp in employees:
            skills = (
                db.query(EmployeeSkill, Skill)
                .join(Skill, EmployeeSkill.skill_id == Skill.skill_id)
                .filter(EmployeeSkill.employee_id == emp.employee_id)
                .all()
            )
            result.append({
                "employee_id": emp.employee_id,
                "name": emp.name,
                "grade": emp.grade,
                "skills": [
                    {"skill_id": s.skill_id, "skill_name": sk.skill_name, "proficiency": s.proficiency}
                    for s, sk in skills
                ],
            })
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 4: 직원 현재 배치 현황 조회 ────────────────────
@mcp.tool()
def get_employee_assignments(employee_id: str, include_past: bool = False) -> str:
    """직원의 배치 현황을 반환합니다.
    include_past: True이면 종료된 배치도 포함
    """
    from app.models.assignment import Assignment
    from app.models.project import Project

    db = _get_db()
    try:
        _auth_and_log(db, "get_employee_assignments", f"employee_id={employee_id}, include_past={include_past}")
        today = date.today()
        query = (
            db.query(Assignment, Project)
            .join(Project, Assignment.project_code == Project.project_code)
            .filter(Assignment.employee_id == employee_id)
        )
        if not include_past:
            query = query.filter(Assignment.actual_end_date >= today)

        rows = query.all()
        result = [
            {
                "project_code": a.project_code,
                "project_name": p.project_name,
                "client": p.client,
                "actual_start_date": str(a.actual_start_date),
                "actual_end_date": str(a.actual_end_date),
                "actual_manpower_pct": round(a.actual_manpower * 100, 1),
            }
            for a, p in rows
        ]
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 5: 프로젝트 리소스 요약 ────────────────────────
@mcp.tool()
def get_project_resource_summary(project_code: str) -> str:
    """프로젝트의 계약 공수 대비 배치 현황 요약을 반환합니다."""
    from app.models.project import Project
    from app.models.assignment import Assignment
    from app.models.employee import Employee

    db = _get_db()
    try:
        _auth_and_log(db, "get_project_resource_summary", f"project_code={project_code}")
        project = db.query(Project).filter(Project.project_code == project_code).first()
        if not project:
            return json.dumps({"error": "프로젝트를 찾을 수 없습니다."}, ensure_ascii=False)

        assignments = (
            db.query(Assignment, Employee)
            .join(Employee, Assignment.employee_id == Employee.employee_id)
            .filter(Assignment.project_code == project_code)
            .all()
        )

        by_grade: dict[str, dict[str, float]] = {
            "특급": {"contracted": project.senior_manpower, "assigned": 0.0},
            "고급": {"contracted": project.advanced_manpower, "assigned": 0.0},
            "중급": {"contracted": project.intermediate_manpower, "assigned": 0.0},
            "초급": {"contracted": project.junior_manpower, "assigned": 0.0},
        }
        total_assigned = 0.0
        for a, e in assignments:
            by_grade[e.grade]["assigned"] += a.actual_manpower
            total_assigned += a.actual_manpower

        return json.dumps({
            "project_code": project.project_code,
            "project_name": project.project_name,
            "client": project.client,
            "status": project.status,
            "total_manpower": project.total_manpower,
            "assigned_manpower": round(total_assigned, 2),
            "remaining_manpower": round(project.total_manpower - total_assigned, 2),
            "by_grade": {
                g: {"contracted": v["contracted"], "assigned": round(v["assigned"], 2)}
                for g, v in by_grade.items()
            },
        }, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 6: 팀 전체 활용률 리포트 ───────────────────────
@mcp.tool()
def get_team_utilization_report(start_date: str, end_date: str) -> str:
    """기간 내 직원별 배치율(활용률)을 반환합니다."""
    from app.models.employee import Employee
    from app.models.assignment import Assignment

    db = _get_db()
    try:
        _auth_and_log(db, "get_team_utilization_report", f"start={start_date}, end={end_date}")
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)

        employees = db.query(Employee).all()
        result = []
        for emp in employees:
            overlapping = (
                db.query(Assignment)
                .filter(
                    Assignment.employee_id == emp.employee_id,
                    Assignment.actual_start_date <= ed,
                    Assignment.actual_end_date >= sd,
                )
                .all()
            )
            total = sum(a.actual_manpower for a in overlapping)
            result.append({
                "employee_id": emp.employee_id,
                "name": emp.name,
                "grade": emp.grade,
                "utilization_pct": round(min(total, 1.0) * 100, 1),
                "assignment_count": len(overlapping),
            })
        result.sort(key=lambda x: -x["utilization_pct"])
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ── Tool 7: 배치 충돌 여부 확인 ─────────────────────────
@mcp.tool()
def check_assignment_conflict(
    employee_id: str,
    start_date: str,
    end_date: str,
    manpower: float,
    exclude_project_code: str = "",
) -> str:
    """배치 등록 시 충돌 여부를 사전에 확인합니다.
    manpower: 투입 공수 0.0~1.0
    exclude_project_code: 수정 시 현재 배치 제외용
    """
    from app.models.assignment import Assignment
    from app.models.project import Project

    db = _get_db()
    try:
        _auth_and_log(db, "check_assignment_conflict",
                      f"employee_id={employee_id}, start={start_date}, end={end_date}, mp={manpower}")
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)

        q = (
            db.query(Assignment, Project)
            .join(Project, Assignment.project_code == Project.project_code)
            .filter(
                Assignment.employee_id == employee_id,
                Assignment.actual_start_date <= ed,
                Assignment.actual_end_date >= sd,
            )
        )
        if exclude_project_code:
            q = q.filter(Assignment.project_code != exclude_project_code)

        existing = q.all()
        current_total = sum(a.actual_manpower for a, _ in existing)
        new_total = current_total + manpower
        has_conflict = new_total > 1.0

        return json.dumps({
            "has_conflict": has_conflict,
            "current_total_pct": round(current_total * 100, 1),
            "new_total_pct": round(new_total * 100, 1),
            "conflicting_assignments": [
                {
                    "project_code": a.project_code,
                    "project_name": p.project_name,
                    "start": str(a.actual_start_date),
                    "end": str(a.actual_end_date),
                    "manpower_pct": round(a.actual_manpower * 100, 1),
                }
                for a, p in existing
            ],
        }, ensure_ascii=False)
    finally:
        db.close()


# ── 진입점 ──────────────────────────────────────────────
if __name__ == "__main__":
    # STDIO 모드 실행
    # 환경변수 MCP_API_KEY 에 발급받은 API Key를 설정해야 합니다.
    #
    # Claude Desktop 설정 예시 (claude_desktop_config.json):
    # {
    #   "mcpServers": {
    #     "men-manager": {
    #       "command": "python",
    #       "args": ["-m", "app.mcp.server"],
    #       "cwd": "D:/VS-Workspace/claude-workspace/menManager/backend",
    #       "env": { "MCP_API_KEY": "your-api-key-here" }
    #     }
    #   }
    # }
    #
    # SSE / Streamable HTTP 전환 방법:
    #   mcp.run(transport="sse")               # SSE
    #   uvicorn app.mcp.server:mcp.streamable_http_app --port 8001  # HTTP
    mcp.run(transport="stdio")
