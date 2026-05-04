---
author: Kim Jeong-woong
date: 2026-04-19
description: React + TypeScript UI 담당. Phase 1 구조 → Phase 3 API 연동 순으로 진행.
---

# agents/frontEnd.md — Frontend Agent

<!-- #Harness Engineering Start : 역할 정의 -->
## 역할
React + TypeScript UI 전담.
<!-- #Harness Engineering End : 역할 정의 -->

<!-- #Harness Engineering Start : 선행 조건 -->
## 선행 조건
- Phase 1: 독립 실행 가능
- Phase 3: `agents/backEnd.md` 완료 후 API 연동 시작
- `docs/architecture/api_spec.md` 참고해서 구현
<!-- #Harness Engineering End : 선행 조건 -->

<!-- #Harness Engineering Start : 범위 제한 -->
## 범위
`frontend/src/` (types · pages · components · hooks · api)
<!-- #Harness Engineering End : 범위 제한 -->

## 페이지

### 인증
- `/login` — 로그인
- `/register` — 회원가입
- `/update/:id/updatePW` — 비밀번호변경

### 프로젝트
- `/projects` — 목록 조회
- `/projects/:id` — 상세 조회 · 수정 · 삭제
- `/projects/new` — 등록
- `/projects/:id/history` — 이력 조회

### 직원
- `/employees` — 목록 조회
- `/employees/:id` — 상세 조회 · 수정 · 삭제
- `/employees/new` — 등록
- `/employees/:id/history` — 이력 조회
- `/employees/:id/skills` — 스킬 조회 · 등록 · 수정 · 삭제

### 인력배치
- `/assignments` — 목록 조회
- `/assignments/new` — 등록
- `/assignments/:id` — 상세 조회 · 수정 · 삭제
- `/assignments/:id/history` — 이력 조회

### 스킬
- `/skills` — 목록 조회 · 등록 · 수정 · 삭제

### MCP API Key
- `/mypage/apikey` — API Key 조회 · 발급 · 삭제 · 사용이력 조회

<!-- #Harness Engineering Start : 구현 규칙 -->
## 디자인
- 스타일: 미니멀 / 클린 (화이트 베이스, 여백 넓게)
- 레이아웃: 상단 네비게이션
- UI 라이브러리: shadcn/ui + Tailwind CSS
- 다크모드: 미지원 (MVP 기준)
- JWT 토큰 사용
- 로그인 후 토큰 저장 → 모든 API 요청 헤더에 자동 포함
- 미로그인 시 `/login` 으로 리다이렉트

## 추가 로직
> 2026-04-20 · By Kim Jeong-woong
- 인력배치 조회는 프로젝트 기준으로 조회하고 배치된 인력들의 최소 월 ~ 최대 월을 찾아낸 후 열로 나타내서 공수를 보여줌. 그리드는 아래와 같이 구현.
- 프로젝트명|사번|직원명|최소월 공수|최소다음월 공수|...|최종월 공수

## 인력 배치 상세 페이지 표시 규칙
> 2026-04-20 · By Kim Jeong-woong

- 페이지 제목: "배치 상세" → **"인력 배치 상세"**
- 카드 제목: `직원명(사번) — 프로젝트명(프로젝트코드) (N개월)` 형식으로 표시.
  - 예: `홍길동(EMP001) — 차세대 뱅킹 시스템(PRJ001) (3개월)`

## 투입공수 표시 및 입력 규칙
> 2026-04-20 · By Kim Jeong-woong

- **투입공수는 소수(0.01 ~ 1.0)로 직접 입력·표시한다. % 변환 금지.**
- 입력 예시: 0.5, 0.2, 1.0
- 목록·상세·수정 등 모든 화면에서 동일하게 소수 그대로 표시.
- 컬럼 헤더는 **투입공수(MM)** 으로 표기한다.

## API 엔드포인트 후행 슬래시 규칙
> 2026-04-20 · By Kim Jeong-woong

- **`src/api/` 내 모든 엔드포인트 URL은 반드시 후행 슬래시(`/`)로 끝나야 한다.**
- 예시: `/api/v1/projects/${code}/`, `/api/v1/employees/${id}/history/`
- **이유**: 백엔드 라우트가 슬래시로 정의되어 있으므로, 슬래시 없이 호출하면 307 리다이렉트 발생 → `Authorization` 헤더 소실 → 401 → 강제 로그아웃.

## 이력 페이지 표시 규칙
> 2026-04-20 · By Kim Jeong-woong

- **이력은 이벤트 당 1 row로 표시한다.** (필드별 row 방식 사용 금지)
- 테이블 컬럼: `변경일시 · 이벤트(Badge) · 변경 내용 · 변경자`
- `변경 내용` 셀은 `ChangesSummary` 컴포넌트로 렌더링:
  - INSERT: `필드명: 값` 목록
  - UPDATE: `필드명: 변경전(취소선) → 변경후`
  - DELETE: `필드명: 값` 목록
- 타입 정의: `changed_field / old_value / new_value` 대신 `old_values / new_values: Record<string, string | null>` 사용.

## Docker 배포 nginx 설정
> 2026-04-22 · By Kim Jeong-woong

- `frontend/nginx.conf` 필수 — Docker 빌드 시 포함됨 (`Dockerfile`에서 COPY).
- `/api` 요청은 `http://backend:9000` 으로 프록시.
- `proxy_redirect http://backend:9000/ /` 설정 필수.
  - **이유**: FastAPI 307 리다이렉트 응답의 `Location` 헤더가 `http://backend:9000/...` (Docker 내부 호스트명)으로 오는데, 브라우저는 이 주소에 접근 불가. 상대경로(`/...`)로 변환해야 브라우저가 정상적으로 따라갈 수 있음.
<!-- #Harness Engineering End : 구현 규칙 -->

<!-- #Harness Engineering Start : 완료 기준 -->
## 완료 기준
- [ ] Phase 1: 타입 정의 · 라우팅 · 더미 렌더링 · 빌드 에러 0
- [ ] Phase 3: 전체 API 연동 · 로딩·에러 처리 · 빌드 에러 0
<!-- #Harness Engineering End : 완료 기준 -->
