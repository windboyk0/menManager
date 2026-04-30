---
author: Kim Jeong-woong
date: 2026-04-19
description: 통합 테스트, 환경 설정, README 담당. 전체 에이전트 완료 후 마지막 실행.
---

# agents/qa.md — QA Agent

## 역할
통합 테스트 · 환경 정비 · 문서화 전담.

## 선행 조건
전체 에이전트 완료 후 시작

## 범위
`.env.example` · `README.md` · `backend/tests/test_integration.py`

## 테스트 시나리오

### REST API
- A: 배치 정상 플로우 (등록 → 조회 → 수정 → 삭제)
- B: 배치 충돌 감지 → 409
- C: 스킬 기반 직원 검색
- D: 가용 인력 조회

### 인증
- E: 회원가입 → 로그인 → JWT 토큰 발급 · 검증
- F: API Key 발급 · 조회 · 삭제

### MCP
- G: MCP tool 7개 정상 호출 확인
- H: 잘못된 API Key → 401 반환 확인

## 환경 변수 필수 항목
> 2026-04-22 · By Kim Jeong-woong

`.env.example`에 아래 항목이 포함되어야 한다:
- `ADMIN_PASSWORD` — 초기 admin 비밀번호 (소스 하드코딩 금지)
- `DATABASE_URL` — `.env`에 넣지 말 것. Docker 전용 경로이므로 `docker-compose.yml`의 `environment` 섹션에서 주입
- `JWT_SECRET` — 운영 환경에서 반드시 변경 > python -c "import secrets; print(secrets.token_hex(32))"

## 완료 기준
- [ ] 시나리오 A·B·C·D·E·F·G·H 전체 통과
- [ ] `.env.example` 최신화 완료
- [ ] README 기준 클린 환경 실행 가능
