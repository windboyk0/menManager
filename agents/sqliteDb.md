---
author: Kim Jeong-woong
date: 2026-04-19
description: SQLite 스키마, ORM 모델, 마이그레이션, 시드 데이터 담당.
---

# agents/sqliteDb.md — SQLite DB Agent

<!-- #Harness Engineering Start : 역할 정의 -->
## 역할
DB 기반 전체 담당. Phase 1 최우선 완료.
<!-- #Harness Engineering End : 역할 정의 -->

<!-- #Harness Engineering Start : 선행 조건 -->
## 선행 조건
`docs/architecture/erd.md` 확인 후 시작
<!-- #Harness Engineering End : 선행 조건 -->

<!-- #Harness Engineering Start : 범위 제한 -->
## 범위
`backend/app/models/` · `backend/app/db/` · `database/`
<!-- #Harness Engineering End : 범위 제한 -->

<!-- #Harness Engineering Start : 완료 기준 -->
## 완료 기준
- [ ] 전체 테이블 마이그레이션 완료
- [ ] WAL 모드 활성화
- [ ] 시드 데이터 삽입 (프로젝트 5 · 직원 20 · 배치 15 이상)
<!-- #Harness Engineering End : 완료 기준 -->
