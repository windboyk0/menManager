# API 명세 — 인력 관리 시스템

## 공통 규칙
- Base prefix: `/api/v1/`
- 인증: `Authorization: Bearer {JWT}` (Frontend 전용)
- MCP Key 인증: `X-API-KEY: {key}` (MCP 전용)
- 날짜 포맷: `YYYY-MM-DD`
- 배치율(actual_manpower): `0.00 ~ 1.00` (1.0 = 100%, 소수점 2자리)
- 공수(manpower): `DECIMAL(10,2)`, 소수점 2자리

---

## 인증 (Auth)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/register` | ✗ | 회원가입 (직원 + 회원 동시 생성) |
| POST | `/api/v1/auth/login` | ✗ | 로그인 → JWT 반환 |

### POST /api/v1/auth/register
Request:
```json
{
  "employee_id": "EMP021",
  "name": "홍길동",
  "career_years": 5,
  "grade": "중급",
  "join_date": "2020-01-01",
  "position": "대리",
  "title": "팀원",
  "username": "hong",
  "password": "secret123",
  "role": "일반"
}
```
Response: `201 Created` `{ "employee_id": "...", "username": "..." }`

### POST /api/v1/auth/login
Request: `{ "username": "admin", "password": "admin123" }`
Response: `{ "access_token": "...", "token_type": "bearer" }`

---

## MCP API Key

| Method | Path | Auth | 권한 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/mcp/apikey` | JWT | 본인 | API Key 발급 |
| GET | `/api/v1/mcp/apikey` | JWT | 본인 | API Key 조회 |
| DELETE | `/api/v1/mcp/apikey` | JWT | 본인 | API Key 비활성화 |
| GET | `/api/v1/mcp/apikey/history` | JWT | 본인 | MCP 사용이력 조회 |

---

## 프로젝트 (Projects)

| Method | Path | Auth | 권한 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/projects` | JWT | 관리자 | 등록 |
| GET | `/api/v1/projects` | JWT | 모두 | 목록 조회 |
| GET | `/api/v1/projects/{code}` | JWT | 모두 | 상세 조회 |
| PUT | `/api/v1/projects/{code}` | JWT | 관리자 | 수정 |
| DELETE | `/api/v1/projects/{code}` | JWT | 관리자 | 삭제 |
| GET | `/api/v1/projects/{code}/history` | JWT | 모두 | 이력 조회 |

Query params for GET list: `status`, `client`

---

## 직원 (Employees)

| Method | Path | Auth | 권한 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/employees` | JWT | 관리자 | 등록 |
| GET | `/api/v1/employees` | JWT | 모두 | 목록 조회 |
| GET | `/api/v1/employees/{id}` | JWT | 모두 | 상세 조회 |
| PUT | `/api/v1/employees/{id}` | JWT | 관리자 | 수정 |
| DELETE | `/api/v1/employees/{id}` | JWT | 관리자 | 삭제 |
| GET | `/api/v1/employees/{id}/history` | JWT | 모두 | 이력 조회 |
| POST | `/api/v1/employees/{id}/skills` | JWT | 관리자 | 스킬 추가 |
| GET | `/api/v1/employees/{id}/skills` | JWT | 모두 | 스킬 조회 |
| PUT | `/api/v1/employees/{id}/skills/{skill_id}` | JWT | 관리자 | 스킬 수정 |
| DELETE | `/api/v1/employees/{id}/skills/{skill_id}` | JWT | 관리자 | 스킬 삭제 |

Query params for GET list: `grade`, `available_from`, `available_to`, `skill_ids`

---

## 인력배치 (Assignments)

| Method | Path | Auth | 권한 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/assignments` | JWT | 관리자 | 등록 |
| GET | `/api/v1/assignments` | JWT | 모두 | 목록 조회 |
| GET | `/api/v1/assignments/{emp_id}/{proj_code}` | JWT | 모두 | 상세 조회 |
| PUT | `/api/v1/assignments/{emp_id}/{proj_code}` | JWT | 관리자 | 수정 |
| DELETE | `/api/v1/assignments/{emp_id}/{proj_code}` | JWT | 관리자 | 삭제 |
| GET | `/api/v1/assignments/{emp_id}/{proj_code}/history` | JWT | 모두 | 이력 조회 |

Query params for GET list: `employee_id`, `project_code`, `active` (boolean)

**충돌 감지**: 동일 직원의 겹치는 기간 배치율 합계 > 1.0 → `409 Conflict`

---

## 스킬 (Skills)

| Method | Path | Auth | 권한 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/skills` | JWT | 관리자 | 등록 |
| GET | `/api/v1/skills` | JWT | 모두 | 목록 조회 |
| PUT | `/api/v1/skills/{id}` | JWT | 관리자 | 수정 |
| DELETE | `/api/v1/skills/{id}` | JWT | 관리자 | 삭제 |

Query params: `category`
