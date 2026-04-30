# 인력 관리 시스템

프로젝트 인력 배치 관리를 위한 풀스택 웹 애플리케이션.

## 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | TypeScript + React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2 |
| Database | SQLite (WAL 모드) |
| MCP Server | Python MCP SDK (STDIO) |
| 런타임 요구사항 | Python ≥ 3.11 · Node.js ≥ 18 |

## 빠른 시작

### 1. Backend API 서버

```bash
cd backend

# Python 버전 확인 (3.11 이상 필요)
python --version

python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# .env 파일 생성 (최초 1회)
cp .env.example .env   # macOS/Linux
# copy .env.example .env  # Windows

uvicorn app.main:app --reload --port 9000
```

- API 문서: http://localhost:9000/docs
- 기본 관리자 계정: `admin` / `.env`의 `ADMIN_PASSWORD` 값

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- 브라우저: http://localhost:3000

### 3. MCP Server (선택 사항)

1. 백엔드 서버 실행 후 브라우저에서 로그인 → `/mypage/apikey` 에서 API Key 발급
2. Claude Desktop `claude_desktop_config.json` 설정:

```json
{
  "mcpServers": {
    "men-manager": {
      "command": "D:/VS-Workspace/claude-workspace/menManager/backend/venv/Scripts/python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "D:/VS-Workspace/claude-workspace/menManager/backend",
      "env": {
        "MCP_API_KEY": "여기에-발급받은-API-Key"
      }
    }
  }
}
```

> **주의:** `command`에 전역 `python`이 아닌 venv python 절대경로를 사용해야 합니다.  
> Claude Desktop은 shell을 거치지 않아 venv 활성화가 적용되지 않습니다.  
> macOS/Linux라면 `venv/bin/python`을 절대경로로 지정하세요.

## 디렉토리 구조

```
menManager/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI 라우터
│   │   ├── db/           # DB 연결 + 시드 데이터
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── schemas/      # Pydantic v2 스키마
│   │   ├── services/     # 비즈니스 로직
│   │   └── mcp/          # MCP 서버 (7개 조회 Tool)
│   ├── tests/            # 통합 테스트 (30개)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/          # Axios API 클라이언트
│       ├── components/   # UI 컴포넌트 (shadcn/ui)
│       ├── hooks/        # TanStack Query 훅
│       ├── pages/        # 19개 페이지
│       └── types/        # TypeScript 타입 정의
├── database/
│   └── menManager.db     # SQLite DB (자동 생성)
├── docs/architecture/    # ERD, API 명세, MCP 명세, ADR
└── agents/               # 에이전트 명세 파일
```

## 주요 기능

### 프로젝트 관리
- CRUD + 변경 이력 추적
- 등급별 계약 공수 관리 (특급/고급/중급/초급)
- 진행 상태 관리 (진행중/완료/대기/취소)

### 직원 관리
- CRUD + 변경 이력 추적
- 스킬 및 숙련도 관리 (1~5점)
- 등급별 조회, 기간 가용성 조회

### 인력 배치
- 배치율 합계 100% 초과 방지 (자동 충돌 감지 → 409)
- 배치 변경 이력 추적

### 인증
- Frontend: JWT (24시간 유효)
- MCP/외부 연동: API Key (`X-API-KEY` 헤더)
- 권한: 관리자 / 일반

### MCP Tools (7개, 조회 전용)
1. `get_project_assignments` — 프로젝트 배치 인원
2. `get_available_employees` — 기간 내 가용 직원
3. `search_employees_by_skill` — 스킬 기반 직원 검색
4. `get_employee_assignments` — 직원 배치 현황
5. `get_project_resource_summary` — 프로젝트 리소스 요약
6. `get_team_utilization_report` — 팀 활용률 리포트
7. `check_assignment_conflict` — 배치 충돌 사전 확인

## 테스트

```bash
cd backend
pytest tests/ -v
# 30개 통합 테스트 (A~F 시나리오)
```

## 환경 변수

`backend/.env` 파일 생성 (`.env.example` 참고):

```env
ADMIN_PASSWORD=변경필수
JWT_SECRET=변경필수  # python -c "import secrets; print(secrets.token_hex(32))"
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:3000"]
```

## Docker 배포

### 1. 이미지 빌드 및 Docker Hub push (개발 서버에서)

```bash
cd menManager

docker build -t {도커허브ID}/men-backend:v1 ./backend
docker build -t {도커허브ID}/men-frontend:v1 ./frontend

docker login
docker push {도커허브ID}/men-backend:v1
docker push {도커허브ID}/men-frontend:v1
```

### 2. 배포 서버에서

```bash
# 1. 폴더 생성
mkdir menManager && cd menManager

# 2. docker-compose.yml 복사 (개발 서버에서 가져오기)

# 3. .env 파일 생성
mkdir backend
vi backend/.env
# ADMIN_PASSWORD, JWT_SECRET, CORS_ORIGINS 입력

# 4. 실행 (이미지 자동 pull 후 실행)
docker-compose up -d

# 5. 로그 확인
docker logs mm-backend
docker logs mm-frontend
```

- 프론트엔드: `http://서버IP:3000`
- 백엔드 API 문서: `http://서버IP:9000/docs`
