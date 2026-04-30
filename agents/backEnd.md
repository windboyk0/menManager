---
author: Kim Jeong-woong
date: 2026-04-19
description: FastAPI REST API 및 인력 배치 비즈니스 로직(가용성·매칭·충돌감지) 담당.
---

# agents/backEnd.md — Backend Agent

## 역할
API 서버 + 비즈니스 로직 전담.

## 언어 및 라이브러리
- Python 3.11+
- FastAPI · Pydantic v2 · SQLAlchemy 2.x · python-jose (JWT) · passlib (비밀번호 해싱)

## 선행 조건
- `agents/sqliteDb.md` 완료 후 시작
- `docs/architecture/api_spec.md` 참고해서 구현
- `docs/architecture/mcp_spec.md` 참고해서 구현

## 범위
`backend/app/api/` · `backend/app/schemas/` · `backend/app/services/` · `backend/tests/`

## 인증
- Frontend → JWT (로그인 시 토큰 발급, 모든 API 요청에 검증)
- 외부 연동·MCP → API Key (`X-API-KEY` 헤더 검증)

## 핵심 로직
- 가용성 계산 (기간 내 잔여 배치율)
- 배치 충돌 감지 → 409 반환
- 스킬 기반 직원 매칭
- 이력 기록은 서비스 레이어에서 직접 처리 (DB 트리거 방식 폐기 — 아래 규칙 참고)

## 추가 로직
> 2026-04-20 · By Kim Jeong-woong
- 직원 기준으로 동일월별 공수의 합산이 1.0 이 최대.
- 투입공수는 소수(0.01 ~ 1.0)로 저장·검증한다. % 단위 변환 없이 그대로 처리.

## 라우트 후행 슬래시 규칙
> 2026-04-20 · By Kim Jeong-woong

- **모든 라우트는 후행 슬래시(`/`)로 끝나야 한다.**
- 예시: `@router.get("/{code}/")`, `@router.put("/{emp_id}/{proj_code}/")`
- **이유**: FastAPI는 `redirect_slashes=True`(기본값)이므로, 슬래시 없는 라우트에 슬래시 포함 URL이 들어오면 307 리다이렉트 발생. 307 리다이렉트 시 `Authorization` 헤더가 소실되어 401 → 클라이언트 로그아웃 현상이 발생한다.
- 목록 라우트(`/`)는 이미 슬래시로 끝나므로 해당 없음.

## 이력 저장 방식 — Row 단위 설계
> 2026-04-20 · By Kim Jeong-woong

- **이력 테이블은 이벤트(INSERT/UPDATE/DELETE) 당 1 row로 저장한다.**
- 컬럼 구성: `id · changed_at · <PK 식별자> · event_type · old_values(JSON TEXT) · new_values(JSON TEXT) · changed_by`
  - INSERT: `old_values = NULL`, `new_values = {...전체 필드}`
  - UPDATE: `old_values = {...변경 전 필드만}`, `new_values = {...변경 후 필드만}`
  - DELETE: `old_values = {...전체 필드}`, `new_values = NULL`
- JSON 직렬화는 서비스 레이어에서 `json.dumps(..., ensure_ascii=False)` 로 처리.
- Pydantic 스키마의 `old_values / new_values` 필드는 `field_validator`로 JSON 문자열 → `dict` 자동 파싱.
- **DB 트리거 미사용 이유**: SQLite 트리거는 앱 컨텍스트(`changed_by`)에 접근 불가. 서비스 레이어 방식이 변경자 추적까지 정확히 처리 가능하므로 트리거 방식을 채택하지 않는다.
- DB 스키마 변경 시 `main.py` startup의 `_migrate_history_tables()`가 구 컬럼(`changed_field`) 감지 후 자동 DROP·재생성.

## 초기 admin 계정 생성 규칙
> 2026-04-22 · By Kim Jeong-woong

- `backend/app/db/init_db.py`의 `seed_data()`에서 최초 실행 시 admin 계정 생성.
- admin 비밀번호는 소스에 하드코딩 금지. `os.getenv("ADMIN_PASSWORD")`로 환경변수에서 읽어야 한다.
- `.env`에 `ADMIN_PASSWORD` 반드시 설정 필요. 누락 시 오류 발생.

## 완료 기준
- [ ] Swagger UI 정상 (`/docs`)
- [ ] 단위 테스트 통과
- [ ] 충돌 시 409 응답 확인
