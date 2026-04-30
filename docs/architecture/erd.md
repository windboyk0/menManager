# ERD — 인력 관리 시스템

## 테이블 관계

```
projects (1) ──── (N) assignments (N) ──── (1) employees
                                                  │
                                            (N) employee_skills (N) ──── (1) skills
                                                  │
                                            (1) members
                                                  │
                                            (1) mcp_api_keys
```

## 테이블 정의

### projects (프로젝트)
| 컬럼 | 타입 | PK | Nullable | 설명 |
|------|------|----|----------|------|
| project_code | VARCHAR | PK | N | 프로젝트코드 |
| client | VARCHAR | | N | 발주사 |
| project_name | VARCHAR | | N | 프로젝트명 |
| start_date | DATE | | N | 시작일 |
| end_date | DATE | | N | 종료일 |
| status | VARCHAR | | N | 진행중/완료/대기/취소 |
| inspection_date | DATE | | Y | 검수일자 |
| total_manpower | DECIMAL(10,2) | | N | 총계약공수 |
| contract_amount | BIGINT | | N | 계약금액 |
| senior_manpower | DECIMAL(10,2) | | N | 특급_계약공수 |
| advanced_manpower | DECIMAL(10,2) | | N | 고급_계약공수 |
| intermediate_manpower | DECIMAL(10,2) | | N | 중급_계약공수 |
| junior_manpower | DECIMAL(10,2) | | N | 초급_계약공수 |

### employees (직원)
| 컬럼 | 타입 | PK | Nullable | 설명 |
|------|------|----|----------|------|
| employee_id | VARCHAR | PK | N | 사번 |
| name | VARCHAR | | N | 직원명 |
| career_years | INTEGER | | N | 경력(년) |
| grade | VARCHAR | | N | 특급/고급/중급/초급 |
| join_date | DATE | | N | 입사일자 |
| position | VARCHAR | | N | 직급 |
| title | VARCHAR | | N | 직책 |

### assignments (인력배치)
| 컬럼 | 타입 | PK | Nullable | 설명 |
|------|------|----|----------|------|
| employee_id | VARCHAR | PK(복합) | N | FK → employees |
| project_code | VARCHAR | PK(복합) | N | FK → projects |
| actual_start_date | DATE | PK(복합) | N | 실제투입시작일 |
| actual_end_date | DATE | | N | 실제투입종료일 |
| actual_manpower | FLOAT | | N | 실제투입공수(0.0~1.0) |

### assignment_history (인력배치이력)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| id | INTEGER | PK | N |
| changed_at | DATETIME | | N |
| employee_id | VARCHAR | | N |
| project_code | VARCHAR | | N |
| event_type | VARCHAR | | N | INSERT/UPDATE/DELETE |
| changed_field | VARCHAR | | N |
| old_value | TEXT | | Y |
| new_value | TEXT | | Y |
| changed_by | VARCHAR | | N |

### project_history (프로젝트이력)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| id | INTEGER | PK | N |
| changed_at | DATETIME | | N |
| project_code | VARCHAR | | N |
| event_type | VARCHAR | | N |
| changed_field | VARCHAR | | N |
| old_value | TEXT | | Y |
| new_value | TEXT | | Y |
| changed_by | VARCHAR | | N |

### employee_history (직원이력)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| id | INTEGER | PK | N |
| changed_at | DATETIME | | N |
| employee_id | VARCHAR | | N |
| event_type | VARCHAR | | N |
| changed_field | VARCHAR | | N |
| old_value | TEXT | | Y |
| new_value | TEXT | | Y |
| changed_by | VARCHAR | | N |

### skills (스킬)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| skill_id | INTEGER | PK | N |
| skill_name | VARCHAR | | N |
| category | VARCHAR | | N |

### employee_skills (직원_스킬)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| employee_id | VARCHAR | PK(복합) | N | FK → employees |
| skill_id | INTEGER | PK(복합) | N | FK → skills |
| proficiency | INTEGER | | N | 1~5 |

> 숙련도: 1=입문, 2=초급, 3=중급, 4=고급, 5=전문가

### members (회원)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| employee_id | VARCHAR | PK | N | FK → employees (1:1) |
| username | VARCHAR | UNIQUE | N |
| password_hash | VARCHAR | | N |
| role | VARCHAR | | N | 관리자/일반 |
| created_at | DATETIME | | N |
| last_login_at | DATETIME | | Y |

### member_history (회원이력)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| id | INTEGER | PK | N |
| changed_at | DATETIME | | N |
| employee_id | VARCHAR | | N |
| event_type | VARCHAR | | N |
| changed_field | VARCHAR | | N |
| old_value | TEXT | | Y |
| new_value | TEXT | | Y |
| changed_by | VARCHAR | | N |

### mcp_api_keys (MCP_API_KEY)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| employee_id | VARCHAR | PK | N | FK → employees |
| api_key | VARCHAR | UNIQUE | N |
| created_at | DATETIME | | N |
| is_active | BOOLEAN | | N |
| last_used_at | DATETIME | | Y |

### mcp_usage_history (MCP_사용이력)
| 컬럼 | 타입 | PK | Nullable |
|------|------|----|----------|
| id | INTEGER | PK | N |
| used_at | DATETIME | | N |
| employee_id | VARCHAR | | N |
| tool_name | VARCHAR | | N |
| request_content | TEXT | | N |
| response_status | VARCHAR | | N | success/error |
