# 작업 상태 메모리

## Phase 0 — Architect ✅ (2026-04-20)
- docs/architecture/erd.md ✅
- docs/architecture/api_spec.md ✅
- docs/architecture/mcp_spec.md ✅
- docs/architecture/decisions.md ✅

## Phase 1 — SQLite DB + Frontend 구조 ✅ (2026-04-20)
- backend/app/models/ + db/ ✅
- frontend/ 구조 ✅

## Phase 2 — Backend API + Frontend API 연동 ✅ (2026-04-20)
- FastAPI REST API (프로젝트·직원·배치·스킬·인증·MCP키) ✅
- Frontend 전체 API 연동 ✅

## Phase 3 — MCP Server + Frontend 마무리 ✅ (2026-04-20)
- MCP 7개 조회 tool ✅
- Frontend 전 페이지 완성 ✅

## Phase 4 — QA ✅ (2026-04-20)
- 30개 통합 테스트 전체 통과 (A~F 시나리오) ✅
- .env.example 최신화 ✅
- README 완성 ✅

## Docker 배포 (2026-04-22)
- backend/Dockerfile ✅
- frontend/Dockerfile ✅ (멀티스테이지: Node 빌드 → nginx 서빙)
- frontend/nginx.conf ✅
  - `/api` 요청 → `http://backend:9000` 프록시
  - `proxy_redirect http://backend:9000/ /` — FastAPI 307 Location 헤더를 상대경로로 변환 (브라우저가 내부 Docker 호스트명 접근 불가 문제 해결)
- docker-compose 포트: frontend `3000:80`, backend `9000:9000`
- `DATABASE_URL=sqlite:////app/database/menManager.db` 는 `docker-compose.yml` `environment` 섹션에서 주입 (`.env`에 넣으면 로컬 실행 시 경로 오류 발생)

## 보안 설정
- 초기 admin 비밀번호: `ADMIN_PASSWORD` 환경변수로 주입 (`backend/.env`)
- 소스코드/이미지에 하드코딩 금지
- `backend/.env.example` 에 `ADMIN_PASSWORD` 항목 추가됨

## 핵심 결정사항
- DB 파일: database/menManager.db
- Backend 포트: 9000
- Frontend 포트: 3000
- actual_manpower: 0.0~1.0 (1.0=100%)
- 이력 기록: 서비스 레이어 (트리거 아님)
- MCP: STDIO 트랜스포트
- FastAPI: 0.136.0 (starlette 1.0.0 호환)
