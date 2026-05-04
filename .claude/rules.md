---
author: Kim Jeong-woong
date: 2026-04-19
description: 코드 품질 및 에이전트 행동 규칙 정의.
---

# rules.md

<!-- #Harness Engineering Start : 코드 품질 규칙 -->
## 코드 품질
- 함수 하나당 역할 하나 (단일 책임)
- 함수 길이 50줄 초과 금지
- 하드코딩 금지 — 환경변수 사용
- `.env` 파일 절대 커밋 금지
- 함수/클래스 그리고 중요하거나 복잡한 로직에는 주석 필수
<!-- #Harness Engineering End : 코드 품질 규칙 -->

<!-- #Harness Engineering Start : 에이전트 동작 제어 -->
## 에이전트 행동
- 작업 전 반드시 해당 `agents/*.md` 파일 읽기
- 다른 에이전트 담당 범위 파일 수정 금지
- 완료 기준 체크리스트 전부 통과 후 완료 보고
<!-- #Harness Engineering End : 에이전트 동작 제어 -->

<!-- #Harness Engineering Start : Git 제약 -->
## Git
- 커밋은 사용자가 직접 한다
- 에이전트는 커밋 · 푸시 · 브랜치 생성 금지
<!-- #Harness Engineering End : Git 제약 -->
