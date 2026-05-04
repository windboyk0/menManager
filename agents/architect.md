---
author: Kim Jeong-woong
date: 2026-04-19
description: 시스템 전체 설계 담당. 코드 작성 없이 ERD, API 명세, ADR 문서만 산출한다.
---

# agents/architect.md — Architect Agent

<!-- #Harness Engineering Start : 역할 정의 -->
## 역할
코드 작성 없음. 설계 문서만 생성하여 후속 에이전트의 기준을 수립한다.
<!-- #Harness Engineering End : 역할 정의 -->

## 산출물
- `docs/architecture/erd.md` — 테이블 정의 및 관계
- `docs/architecture/api_spec.md` — 엔드포인트 목록
- `docs/architecture/mcp_spec.md` — MCP tool 목록 및 설명
- `docs/architecture/decisions.md` — 기술 의사결정 (ADR)

## 핵심 도메인
프로젝트 / 직원 / 인력배치 / 스킬 / 회원

## 테이블 정의

### 프로젝트
| 컬럼 | PK |
|------|----|
| 프로젝트코드 | PK |
| 발주사 | |
| 프로젝트명 | |
| 시작일 | |
| 종료일 | |
| 진행상태 | |
| 검수일자 | Nullable |
| 총계약공수 | |
| 계약금액 | |
| 특급_계약공수 | |
| 고급_계약공수 | |
| 중급_계약공수 | |
| 초급_계약공수 | |

### 직원
| 컬럼 | PK |
|------|----|
| 사번 | PK |
| 직원명 | |
| 경력 | |
| 등급 | |
| 입사일자 | |
| 직급 | |
| 직책 | |

### 인력배치
> 2026-04-20 · By Kim Jeong-woong 월별 투입공수관리가 필요하기에 변경
| 컬럼 | PK |
|------|----|
| 사번 | PK |
| 프로젝트코드 | PK |
| 투입월 | PK |
| 투입공수 | |

### 인력배치이력
> 2026-04-20 · By Kim Jeong-woong 월별 투입공수관리가 필요하기에 변경
| 컬럼 | PK |
|------|----|
| 변경일시 | PK |
| 사번 | |
| 프로젝트코드 | |
| 투입월 | |
| 이벤트타입 | INSERT/UPDATE/DELETE |
| 변경항목 | |
| 변경전값 | Nullable |
| 변경후값 | Nullable |
| 변경자 | |

### 프로젝트이력
| 컬럼 | PK |
|------|----|
| 변경일시 | PK |
| 프로젝트코드 | |
| 이벤트타입 | INSERT/UPDATE/DELETE |
| 변경항목 | |
| 변경전값 | Nullable |
| 변경후값 | Nullable |
| 변경자 | |

### 직원이력
| 컬럼 | PK |
|------|----|
| 변경일시 | PK |
| 사번 | |
| 이벤트타입 | INSERT/UPDATE/DELETE |
| 변경항목 | |
| 변경전값 | Nullable |
| 변경후값 | Nullable |
| 변경자 | |

### 스킬
| 컬럼 | PK |
|------|----|
| 스킬ID | PK |
| 스킬명 | |
| 카테고리 | |

### 직원_스킬
| 컬럼 | PK |
|------|----|
| 사번 | PK |
| 스킬ID | PK |
| 숙련도 | 1~5 |

> 숙련도 기준: 1 입문 / 2 초급 / 3 중급 / 4 고급 / 5 전문가

### 회원
| 컬럼 | PK |
|------|----|
| 사번 | PK |
| 아이디 | |
| 비밀번호 | 해시 |
| 권한 | 관리자/일반 |
| 생성일자 | |
| 마지막로그인일시 | |

### 회원이력
| 컬럼 | PK |
|------|----|
| 변경일시 | PK |
| 사번 | |
| 이벤트타입 | INSERT/UPDATE/DELETE |
| 변경항목 | |
| 변경전값 | Nullable |
| 변경후값 | Nullable |
| 변경자 | |

### MCP_API_KEY
| 컬럼 | PK |
|------|----|
| 사번 | PK |
| API_KEY | |
| 생성일시 | |
| 활성화여부 | |
| 마지막사용일시 | Nullable |

### MCP_사용이력
| 컬럼 | PK |
|------|----|
| 사용일시 | PK |
| 사번 | |
| 호출tool명 | |
| 요청내용 | |
| 응답상태 | |

## API 명세

### 회원
- POST `/api/v1/auth/register` — 회원가입
- POST `/api/v1/auth/login` — 로그인
- POST `/api/v1/auth/updatePw` — 비밀번호변경

### MCP API Key
- POST `/api/v1/mcp/apikey` — API Key 발급
- GET `/api/v1/mcp/apikey` — API Key 조회
- DELETE `/api/v1/mcp/apikey` — API Key 삭제
- GET `/api/v1/mcp/apikey/history` — 사용 이력 조회

### 프로젝트
- POST `/api/v1/projects` — 등록
- GET `/api/v1/projects` — 목록 조회
- GET `/api/v1/projects/{프로젝트코드}` — 상세 조회
- PUT `/api/v1/projects/{프로젝트코드}` — 수정
- DELETE `/api/v1/projects/{프로젝트코드}` — 삭제
- GET `/api/v1/projects/{프로젝트코드}/history` — 이력 조회

### 직원
- POST `/api/v1/employees` — 등록
- GET `/api/v1/employees` — 목록 조회
- GET `/api/v1/employees/{사번}` — 상세 조회
- PUT `/api/v1/employees/{사번}` — 수정
- DELETE `/api/v1/employees/{사번}` — 삭제
- GET `/api/v1/employees/{사번}/history` — 이력 조회

### 인력배치
- POST `/api/v1/assignments` — 등록
- GET `/api/v1/assignments` — 목록 조회
- GET `/api/v1/assignments/{사번}/{프로젝트코드}` — 상세 조회
- PUT `/api/v1/assignments/{사번}/{프로젝트코드}` — 수정
- DELETE `/api/v1/assignments/{사번}/{프로젝트코드}` — 삭제
- GET `/api/v1/assignments/{사번}/{프로젝트코드}/history` — 이력 조회

### 스킬
- POST `/api/v1/skills` — 등록
- GET `/api/v1/skills` — 목록 조회
- PUT `/api/v1/skills/{스킬ID}` — 수정
- DELETE `/api/v1/skills/{스킬ID}` — 삭제

### 직원스킬
- POST `/api/v1/employees/{사번}/skills` — 등록
- GET `/api/v1/employees/{사번}/skills` — 조회
- PUT `/api/v1/employees/{사번}/skills/{스킬ID}` — 수정
- DELETE `/api/v1/employees/{사번}/skills/{스킬ID}` — 삭제

## MCP Tool 목록 (조회 전용)

> 모든 MCP tool 호출 시 API Key 인증 필수 (Header: `X-API-KEY`)
> API Key는 Frontend 로그인 후 발급 가능

- 특정 프로젝트 배치 인원 조회
- 특정 기간 가용 직원 조회
- 직원 스킬 기반 검색
- 직원 현재 배치 현황 조회
- 프로젝트 리소스 요약
- 팀 전체 활용률 리포트
- 배치 충돌 여부 확인

> 액션(배치 등록·해제)은 Frontend 에서만 수행. MCP는 조회 전용.

<!-- #Harness Engineering Start : 완료 기준 -->
## 완료 기준
- [ ] ERD 확정
- [ ] API 엔드포인트 목록 확정
- [ ] MCP tool 명세 확정
- [ ] ADR 주요 결정 기록
<!-- #Harness Engineering End : 완료 기준 -->
