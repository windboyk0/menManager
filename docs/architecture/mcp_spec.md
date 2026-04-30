# MCP Tool 명세 — 인력 관리 시스템

## 개요
- 트랜스포트: STDIO (Claude Desktop 연동)
- 인증: 환경변수 `MCP_API_KEY`로 API Key 전달
- 모든 tool은 조회 전용 (액션 불가)
- 모든 호출은 `mcp_usage_history`에 기록됨

## Tool 목록

### 1. get_project_assignments
특정 프로젝트에 배치된 인원 조회

**Parameters:**
- `project_code` (string, required): 프로젝트코드

**Returns:** 배치 직원 목록 `[{ employee_id, name, grade, actual_start_date, actual_end_date, actual_manpower }]`

---

### 2. get_available_employees
특정 기간 가용 직원 조회 (배치율 합계 < 1.0인 직원)

**Parameters:**
- `start_date` (string, required): 조회 시작일 YYYY-MM-DD
- `end_date` (string, required): 조회 종료일 YYYY-MM-DD
- `min_availability` (number, optional): 최소 가용율 (기본: 0.0)

**Returns:** `[{ employee_id, name, grade, available_rate }]`

---

### 3. search_employees_by_skill
직원 스킬 기반 검색

**Parameters:**
- `skill_ids` (array of integers, required): 스킬 ID 목록
- `min_proficiency` (integer, optional): 최소 숙련도 1~5 (기본: 1)

**Returns:** `[{ employee_id, name, grade, skills: [{ skill_name, proficiency }] }]`

---

### 4. get_employee_assignments
직원 현재 배치 현황 조회

**Parameters:**
- `employee_id` (string, required): 사번
- `include_past` (boolean, optional): 과거 이력 포함 여부 (기본: false)

**Returns:** `[{ project_code, project_name, actual_start_date, actual_end_date, actual_manpower }]`

---

### 5. get_project_resource_summary
프로젝트 리소스 요약

**Parameters:**
- `project_code` (string, required): 프로젝트코드

**Returns:**
```json
{
  "project_code": "PRJ001",
  "project_name": "...",
  "total_manpower": 120.0,
  "assigned_manpower": 85.5,
  "remaining_manpower": 34.5,
  "by_grade": {
    "특급": { "contracted": 30.0, "assigned": 20.0 },
    "고급": { "contracted": 40.0, "assigned": 30.5 }
  }
}
```

---

### 6. get_team_utilization_report
팀 전체 활용률 리포트

**Parameters:**
- `start_date` (string, required): 기준 시작일
- `end_date` (string, required): 기준 종료일

**Returns:** `[{ employee_id, name, grade, total_manpower, utilization_rate }]`

---

### 7. check_assignment_conflict
배치 충돌 여부 확인

**Parameters:**
- `employee_id` (string, required): 사번
- `start_date` (string, required): 투입 시작일
- `end_date` (string, required): 투입 종료일
- `manpower` (number, required): 투입 공수 (0.0~1.0)
- `exclude_project_code` (string, optional): 제외할 프로젝트코드 (수정 시)

**Returns:** `{ has_conflict: boolean, current_total: number, new_total: number, conflicting_assignments: [...] }`
