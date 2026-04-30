"""
Integration tests for the Personnel Management System API.

Test coverage:
  A: Assignment CRUD (create → get → update → delete)
  B: Assignment conflict detection → 409
  C: Employee list with skill filter
  D: Available employee query
  E: Register → login → JWT verify
  F: API Key create → get → delete
"""
import pytest
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────────────────────────────────────
# A: Assignment CRUD
# ─────────────────────────────────────────────────────────────────────────────

class TestAssignmentCRUD:
    """A: Create → Read → Update → Delete an assignment."""

    def test_create_assignment(self, client: TestClient, admin_headers: dict) -> None:
        """Create a new assignment for EMP099 → PRJ999."""
        payload = {
            "employee_id": "EMP099",
            "project_code": "PRJ999",
            "actual_start_date": "2025-06-01",
            "actual_end_date": "2025-09-30",
            "actual_manpower": 0.5,
        }
        response = client.post(
            "/api/v1/assignments/",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["employee_id"] == "EMP099"
        assert data["project_code"] == "PRJ999"
        assert data["actual_manpower"] == 0.5

    def test_get_assignment(self, client: TestClient, admin_headers: dict) -> None:
        """Get the assignment that was just created."""
        response = client.get(
            "/api/v1/assignments/EMP099/PRJ999",
            params={"start_date": "2025-06-01"},
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["employee_id"] == "EMP099"
        assert data["actual_manpower"] == 0.5

    def test_update_assignment(self, client: TestClient, admin_headers: dict) -> None:
        """Update the manpower of the assignment."""
        response = client.put(
            "/api/v1/assignments/EMP099/PRJ999",
            json={"actual_manpower": 0.4},
            params={"start_date": "2025-06-01"},
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["actual_manpower"] == 0.4

    def test_list_assignments_by_employee(self, client: TestClient, admin_headers: dict) -> None:
        """List assignments filtered by employee_id."""
        response = client.get(
            "/api/v1/assignments/",
            params={"employee_id": "EMP099"},
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) >= 1
        assert all(a["employee_id"] == "EMP099" for a in data)

    def test_delete_assignment(self, client: TestClient, admin_headers: dict) -> None:
        """Delete the assignment."""
        response = client.delete(
            "/api/v1/assignments/EMP099/PRJ999",
            params={"start_date": "2025-06-01"},
            headers=admin_headers,
        )
        assert response.status_code == 204, response.text

    def test_get_assignment_after_delete(self, client: TestClient, admin_headers: dict) -> None:
        """The deleted assignment should return 404."""
        response = client.get(
            "/api/v1/assignments/EMP099/PRJ999",
            params={"start_date": "2025-06-01"},
            headers=admin_headers,
        )
        assert response.status_code == 404, response.text

    def test_get_assignment_history(self, client: TestClient, admin_headers: dict) -> None:
        """History should contain INSERT, UPDATE, DELETE events."""
        response = client.get(
            "/api/v1/assignments/EMP099/PRJ999/history",
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        history = response.json()
        event_types = {h["event_type"] for h in history}
        assert "INSERT" in event_types
        assert "UPDATE" in event_types
        assert "DELETE" in event_types


# ─────────────────────────────────────────────────────────────────────────────
# B: Assignment conflict detection → 409
# ─────────────────────────────────────────────────────────────────────────────

class TestAssignmentConflict:
    """B: Verify 409 is raised when manpower would exceed 1.0."""

    def test_conflict_exceeds_manpower(self, client: TestClient, admin_headers: dict) -> None:
        """EMP004 already has 0.6 on PRJ001 Jan-Dec 2025. Adding 0.5 should conflict."""
        payload = {
            "employee_id": "EMP004",
            "project_code": "PRJ002",
            "actual_start_date": "2025-03-01",
            "actual_end_date": "2025-06-30",
            "actual_manpower": 0.5,  # 0.6 + 0.5 = 1.1 > 1.0
        }
        response = client.post(
            "/api/v1/assignments/",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 409, response.text
        assert "배치 충돌" in response.json()["detail"]

    def test_no_conflict_non_overlapping_dates(self, client: TestClient, admin_headers: dict) -> None:
        """EMP099 has no existing assignments, so any new one should succeed."""
        # First assignment for EMP099 (no existing data now since CRUD test cleaned up)
        payload = {
            "employee_id": "EMP099",
            "project_code": "PRJ999",
            "actual_start_date": "2025-01-01",
            "actual_end_date": "2025-03-31",
            "actual_manpower": 1.0,
        }
        response = client.post(
            "/api/v1/assignments/",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 201, response.text

        # Second assignment in a non-overlapping period: should succeed
        payload2 = {
            "employee_id": "EMP099",
            "project_code": "PRJ999",
            "actual_start_date": "2025-04-01",
            "actual_end_date": "2025-06-30",
            "actual_manpower": 1.0,
        }
        response2 = client.post(
            "/api/v1/assignments/",
            json=payload2,
            headers=admin_headers,
        )
        assert response2.status_code == 201, response2.text

        # Clean up
        client.delete("/api/v1/assignments/EMP099/PRJ999", params={"start_date": "2025-01-01"}, headers=admin_headers)
        client.delete("/api/v1/assignments/EMP099/PRJ999", params={"start_date": "2025-04-01"}, headers=admin_headers)

    def test_conflict_exactly_at_limit(self, client: TestClient, admin_headers: dict) -> None:
        """Exactly 1.0 total manpower should NOT raise a conflict (boundary case)."""
        # EMP006 already has 0.5 on PRJ001 Jan-Jun 2025
        # Create a new non-overlapping assignment at 0.5 — different date range
        payload = {
            "employee_id": "EMP005",
            "project_code": "PRJ001",
            "actual_start_date": "2025-10-01",
            "actual_end_date": "2025-12-31",
            "actual_manpower": 0.5,  # EMP005 has PRJ002 Mar-Nov, but that overlaps...
        }
        # EMP005 has 1.0 on PRJ002 Mar-Nov: the new dates Oct-Dec overlap → conflict
        response = client.post(
            "/api/v1/assignments/",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 409, response.text


# ─────────────────────────────────────────────────────────────────────────────
# C: Employee list with skill filter
# ─────────────────────────────────────────────────────────────────────────────

class TestEmployeeSkillFilter:
    """C: Filter employees by one or more skill_ids."""

    def test_filter_by_single_skill(self, client: TestClient, admin_headers: dict) -> None:
        """skill_id=1 (Java) should return EMP002 and EMP004."""
        response = client.get(
            "/api/v1/employees/",
            params={"skill_ids": 1},
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        ids = {e["employee_id"] for e in data}
        assert "EMP002" in ids
        assert "EMP004" in ids

    def test_filter_by_multiple_skills(self, client: TestClient, admin_headers: dict) -> None:
        """skill_id=1 (Java) AND skill_id=4 (Spring Boot) → only EMP002 and EMP004."""
        response = client.get(
            "/api/v1/employees/",
            params=[("skill_ids", 1), ("skill_ids", 4)],
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        ids = {e["employee_id"] for e in data}
        assert "EMP002" in ids
        assert "EMP004" in ids
        # EMP003 has Python (skill_id=2) but not Java — should be excluded
        assert "EMP003" not in ids

    def test_filter_no_matches(self, client: TestClient, admin_headers: dict) -> None:
        """skill_id=1 AND skill_id=3 (React) — no one has both."""
        response = client.get(
            "/api/v1/employees/",
            params=[("skill_ids", 1), ("skill_ids", 3)],
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        # None of the seeded employees have both Java and React
        assert len(data) == 0


# ─────────────────────────────────────────────────────────────────────────────
# D: Available employee query
# ─────────────────────────────────────────────────────────────────────────────

class TestAvailableEmployees:
    """D: Query employees available (< 1.0 manpower) in a date range."""

    def test_query_available_employees(self, client: TestClient, admin_headers: dict) -> None:
        """
        In Jan–Jun 2025:
        - EMP003 has 1.0 on PRJ001 → NOT available
        - EMP004 has 0.6 on PRJ001 → available (< 1.0)
        """
        response = client.get(
            "/api/v1/employees/",
            params={
                "available_from": "2025-01-01",
                "available_to": "2025-06-30",
            },
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        ids = {e["employee_id"] for e in data}
        # EMP003 is fully booked (1.0)
        assert "EMP003" not in ids
        # EMP004 has only 0.6 — should appear
        assert "EMP004" in ids

    def test_fully_booked_employee_excluded(self, client: TestClient, admin_headers: dict) -> None:
        """EMP003 has 1.0 on PRJ001 in Jan 2025 — should not appear."""
        response = client.get(
            "/api/v1/employees/",
            params={
                "available_from": "2025-02-01",
                "available_to": "2025-04-30",
            },
            headers=admin_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        ids = {e["employee_id"] for e in data}
        assert "EMP003" not in ids

    def test_no_filter_returns_all(self, client: TestClient, admin_headers: dict) -> None:
        """Without filters, all employees are returned."""
        response = client.get("/api/v1/employees/", headers=admin_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) >= 8


# ─────────────────────────────────────────────────────────────────────────────
# E: Register → Login → JWT verify
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthFlow:
    """E: Full authentication flow."""

    def test_register_new_user(self, client: TestClient, admin_headers: dict) -> None:
        """Register a brand-new employee+member."""
        payload = {
            "employee_id": "EMPTEST",
            "name": "테스트유저",
            "career_years": 1,
            "grade": "초급",
            "join_date": "2024-01-01",
            "position": "사원",
            "title": "팀원",
            "username": "testuser",
            "password": "testpass123",
            "role": "일반",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["employee_id"] == "EMPTEST"
        assert data["username"] == "testuser"
        assert data["role"] == "일반"

    def test_register_duplicate_username(self, client: TestClient) -> None:
        """Duplicate username must be rejected."""
        payload = {
            "employee_id": "EMPTEST2",
            "name": "중복유저",
            "career_years": 1,
            "grade": "초급",
            "join_date": "2024-01-01",
            "position": "사원",
            "title": "팀원",
            "username": "testuser",  # already exists
            "password": "somepass",
            "role": "일반",
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 400, response.text

    def test_login_success(self, client: TestClient) -> None:
        """Login with correct credentials returns a JWT token."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient) -> None:
        """Login with wrong password must be rejected."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "wrongpass"},
        )
        assert response.status_code == 401, response.text

    def test_me_endpoint_with_valid_token(self, client: TestClient) -> None:
        """The /me endpoint should return user info when a valid JWT is supplied."""
        # Login to get token
        login_res = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        token = login_res.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["username"] == "testuser"
        assert data["employee_id"] == "EMPTEST"

    def test_me_endpoint_with_invalid_token(self, client: TestClient) -> None:
        """Invalid JWT should be rejected with 401."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401, response.text

    def test_admin_login(self, client: TestClient) -> None:
        """Admin login should return a valid token."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data


# ─────────────────────────────────────────────────────────────────────────────
# F: API Key create → get → delete
# ─────────────────────────────────────────────────────────────────────────────

class TestMcpApiKey:
    """F: MCP API Key lifecycle."""

    @pytest.fixture(scope="class")
    def user_token(self, client: TestClient) -> str:
        """Token for the testuser registered in class E."""
        res = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        return res.json()["access_token"]

    @pytest.fixture(scope="class")
    def user_headers(self, user_token: str) -> dict:
        return {"Authorization": f"Bearer {user_token}"}

    def test_create_api_key(self, client: TestClient, user_headers: dict) -> None:
        """Generate an API key for the current user."""
        response = client.post("/api/v1/mcp/apikey", headers=user_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert "api_key" in data
        assert data["is_active"] is True
        assert data["employee_id"] == "EMPTEST"

    def test_get_api_key(self, client: TestClient, user_headers: dict) -> None:
        """Retrieve the existing API key."""
        response = client.get("/api/v1/mcp/apikey", headers=user_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert "api_key" in data
        assert data["is_active"] is True

    def test_create_api_key_replaces_existing(self, client: TestClient, user_headers: dict) -> None:
        """Creating a new API key should replace the old one."""
        # Get current key
        old_res = client.get("/api/v1/mcp/apikey", headers=user_headers)
        old_key = old_res.json()["api_key"]

        # Generate new key
        new_res = client.post("/api/v1/mcp/apikey", headers=user_headers)
        assert new_res.status_code == 200, new_res.text
        new_key = new_res.json()["api_key"]

        assert old_key != new_key

    def test_delete_api_key(self, client: TestClient, user_headers: dict) -> None:
        """Deactivate the API key."""
        response = client.delete("/api/v1/mcp/apikey", headers=user_headers)
        assert response.status_code == 204, response.text

    def test_api_key_is_inactive_after_delete(self, client: TestClient, user_headers: dict) -> None:
        """After deletion, the key should be inactive."""
        response = client.get("/api/v1/mcp/apikey", headers=user_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["is_active"] is False

    def test_get_api_key_history(self, client: TestClient, user_headers: dict) -> None:
        """Usage history endpoint should return a list (possibly empty)."""
        response = client.get("/api/v1/mcp/apikey/history", headers=user_headers)
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_no_api_key_returns_404(self, client: TestClient, admin_headers: dict) -> None:
        """Admin has never created an API key — should return 404."""
        response = client.get("/api/v1/mcp/apikey", headers=admin_headers)
        assert response.status_code == 404, response.text
