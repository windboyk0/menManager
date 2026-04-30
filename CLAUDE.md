---
author: Kim Jeong-woong
date: 2026-04-19
description: 멀티 에이전트 기반 프로젝트 인력 관리 시스템 Orchestrator. 에이전트 호출 순서와 전역 제약만 정의한다.
---

# CLAUDE.md — 프로젝트 인력 관리 시스템

## 스택
- Frontend: TypeScript + React + Vite
- Backend: Python + FastAPI
- Database: SQLite
- MCP Server: FastAPI 기반 MCP 서버 (LLM 연동)

## 에이전트 실행 순서
```
Phase 0  agents/architect.md
Phase 1  agents/sqliteDb.md · agents/frontEnd.md  (병렬)
Phase 2  agents/backEnd.md · agents/frontEnd.md        (병렬)
Phase 3  agents/mcp.md · agents/frontEnd.md            (병렬)
Phase 4  agents/qa.md                                  (단독)
```

## 전역 규칙
- 날짜: `YYYY-MM-DD` UTC
- API 접두사: `/api/v1/`
- 배치율 합계 100% 초과 불가
- SQLite WAL 모드 필수
- Python 타입 힌트 필수 / TypeScript `any` 금지
- 인증: Frontend → JWT / 외부 연동·MCP → API Key
- Backend는 REST API + MCP 서버 두 가지 인터페이스로 노출

## 메모리
- 작업 상태는 `.claude/memory.md` 에 기록
- Phase 완료 시마다 업데이트
- 다음 에이전트 호출 전 반드시 참고
