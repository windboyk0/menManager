# ADR — Architecture Decision Records

## ADR-001: SQLite with WAL mode
- **결정**: PostgreSQL 대신 SQLite + WAL 모드 사용
- **이유**: 단일 서버 배포, 운영 복잡도 최소화, WAL로 동시성 충분
- **트레이드오프**: 수평 확장 불가, 대규모 동시 쓰기 제한

## ADR-002: 이중 인증 (JWT + API Key)
- **결정**: Frontend는 JWT, MCP/외부 연동은 API Key
- **이유**: 각 클라이언트 특성에 맞는 인증 방식 적용
- **구현**: JWT는 python-jose, API Key는 UUID v4 + DB 검증

## ADR-003: 이력 기록 방식 — 서비스 레이어
- **결정**: DB 트리거 대신 서비스 레이어에서 이력 기록
- **이유**: SQLite 트리거는 변경자(사번) 정보 접근 불가. 서비스 레이어에서 현재 사용자 컨텍스트에 접근 가능
- **구현**: 각 서비스 메서드 내 INSERT/UPDATE/DELETE 시 history 테이블에 직접 삽입

## ADR-004: MCP 트랜스포트 — STDIO
- **결정**: 현재 STDIO, 추후 Streamable HTTP 확장 가능 구조
- **이유**: Claude Desktop 로컬 연동 우선. 코드에 SSE/HTTP 전환 주석 포함
- **구현**: mcp Python SDK 사용

## ADR-005: 배치율 단위 — 0.0~1.0
- **결정**: actual_manpower를 0.0~1.0 float로 저장 (1.0 = 100%)
- **이유**: 수치 연산 편의성. API/UI에서는 백분율(%) 변환하여 표시
- **충돌 감지**: 동일 직원 겹치는 기간 합계 > 1.0 → 409

## ADR-006: Frontend 상태 관리
- **결정**: TanStack Query (서버 상태) + localStorage (인증 토큰)
- **이유**: 복잡한 전역 상태 관리 불필요. 서버 상태는 React Query로 충분
- **인증**: JWT를 localStorage에 저장, Axios interceptor로 자동 주입
