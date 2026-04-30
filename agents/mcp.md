---
author: Kim Jeong-woong
date: 2026-04-19
description: FastAPI 기반 MCP 서버 구성 담당. LLM이 인력 관리 데이터를 tool로 조회할 수 있도록 노출한다.
---

# agents/mcp.md — MCP Server Agent

## 역할
Backend 서비스 레이어를 MCP tool로 노출. LLM에서 인력 데이터 조회 가능하게 한다.

## 언어 및 라이브러리
- Python 3.11+
- mcp (Python MCP SDK)

## 선행 조건
- `agents/backEnd.md` 완료 후 시작
- `docs/architecture/mcp_spec.md` 참고해서 구현

## 범위
```
backend/app/mcp/
backend/app/mcp/server.py
backend/app/mcp/tools/
```

## 전송 방식
- 현재: STDIO (desktop LLM 연동용)
- 추후 확장 가능하도록 주석으로 SSE / Streamable HTTP 전환 코드 포함할 것

## 인증
- 모든 tool 호출 시 API Key 검증 필수 (`X-API-KEY` 헤더)
- API Key는 MCP_API_KEY 테이블에서 조회 및 검증
- 유효하지 않은 Key → 401 반환

## 사용 이력
- 모든 tool 호출 시 `MCP_사용이력` 테이블에 자동 기록
- 호출 성공/실패 여부 모두 기록

## 에러 처리
- DB 오류 → 500 반환
- 데이터 없음 → 빈 배열 또는 null 반환 (에러 아님)
- 인증 실패 → 401 반환

## MCP Tool 목록 (조회 전용)
- 특정 프로젝트 배치 인원 조회
- 특정 기간 가용 직원 조회
- 직원 스킬 기반 검색
- 직원 현재 배치 현황 조회
- 프로젝트 리소스 요약
- 팀 전체 활용률 리포트
- 배치 충돌 여부 확인

## MCP API Key 소유자 기준
> 2026-04-22 · By Kim Jeong-woong

- `McpApiKey.member_id` = `members.username` 기준 (직원 테이블 무관, FK 없음)
- `McpUsageHistory.employee_id` 도 `members.username` 저장
- 접속 회원(`current_user.username`)으로 발급·조회·삭제

## 완료 기준
- [ ] MCP 서버 기동 확인
- [ ] API Key 인증 정상 동작 확인
- [ ] 7개 tool 호출 및 응답 확인
