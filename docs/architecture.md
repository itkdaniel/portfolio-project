# Synaptiq — Architecture (v2.0.0 Python FastAPI Backend)

> **Synaptic Applications** — AI-native knowledge graph, agent pipeline, and analytics platform.
> Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
>
> **v2.0.0** migrates the backend from TypeScript/Express → **Python 3.12 / FastAPI**
> while keeping the TypeScript React frontend and OpenAPI contract unchanged.

---

## 1. System Overview

```mermaid
graph TB
    subgraph Client ["Browser Client"]
        FE["TypeScript React SPA<br/>(Vite 6 + Wouter + shadcn/ui)"]
    end

    subgraph Platform ["Replit Platform / Cloud"]
        PROXY["Reverse Proxy (path-based)"]
        API["Python FastAPI<br/>uvicorn ASGI — port 8080"]
        DB["PostgreSQL 16<br/>(SQLAlchemy 2.0 + asyncpg)"]
        STORE["Object Storage (Replit Buckets)"]
        CLERK["Clerk Auth (JWKS / RS256)"]
    end

    subgraph External ["External APIs"]
        HN["Hacker News Firebase API"]
        CG["CoinGecko Markets API"]
        CP["CryptoPanic News API"]
    end

    FE -->|HTTPS| PROXY
    PROXY -->|"/api/*"| API
    PROXY -->|"/"| FE
    API -->|asyncpg| DB
    API -->|httpx| STORE
    API -->|JWKS fetch cached 5 min| CLERK
    API -->|httpx async| HN & CG & CP
```

---

## 2. Python Backend — FastAPI Application Structure

```mermaid
graph LR
    subgraph FastAPI ["artifacts/api-server/src/"]
        MAIN["main.py — App factory + lifespan"]
        CFG["config.py — Pydantic BaseSettings"]
        DB2["database.py — Async engine + session"]
        MW["middleware/auth.py — Clerk JWKS JWT"]

        subgraph Routers ["routers/"]
            R1["health · users · profile"]
            R2["agent · tests · knowledge-graph · storage"]
        end

        subgraph Services ["services/ (Factory pattern)"]
            S1["UserService · ProfileService"]
            S2["AgentService · TestService · GraphService"]
            SB["BaseService[ModelT]"]
        end

        subgraph Schemas ["schemas/ (Pydantic v2)"]
            SC["common · user · profile"]
            SC2["agent · tests · knowledge_graph"]
        end

        subgraph Models ["models/ (SQLAlchemy 2.0)"]
            M["User · Profile · DataSource"]
            M2["ScrapeJob · FeatureSet · TrainingRun · TestRun"]
        end

        subgraph Agent ["agent/"]
            AG["scrape.py · process.py · train.py"]
            AG2["csv_utils.py · data_sources.py"]
        end
    end

    MAIN --> Routers
    MAIN --> MW
    Routers --> Services
    Services --> Models
    Services --> Agent
    Routers --> Schemas
    Services --> DB2
    CFG --> DB2
    CFG --> MW
    S1 & S2 --> SB
```

---

## 3. Agent Pipeline — Scrape → Process → Train

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant A as FastAPI
    participant S as AgentService
    participant Sc as scrape.py
    participant DB as PostgreSQL

    U->>A: POST /api/agent/scrape {source}
    A->>S: run_scrape(source, path, user)
    S->>DB: INSERT scrape_job (status=running)
    S->>Sc: scrape_data_source(source_name) [async httpx]
    Sc-->>S: list[dict] records
    S->>DB: UPDATE scrape_job (status=complete, record_count=N)
    A-->>U: ScrapeJobOut JSON

    U->>A: POST /api/agent/process {scrape_job_id, feature_names}
    A->>S: run_process(job_id, features, user)
    S->>DB: INSERT feature_set (row_count=N)
    A-->>U: FeatureSetOut JSON

    U->>A: POST /api/agent/train {feature_set_id}
    A->>S: run_train(feature_set_id, user)
    S->>DB: INSERT training_run (status=running)
    Note over S: train.py: lightweight stats model
    S->>DB: UPDATE training_run (metrics, status=complete)
    A-->>U: TrainingRunOut JSON
```

---

## 4. Auth & RBAC — Clerk JWT (PyJWT + JWKS)

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as Clerk
    participant A as FastAPI (middleware/auth.py)
    participant US as UserService
    participant DB as PostgreSQL

    B->>C: Sign in (OIDC)
    C-->>B: RS256 JWT (kid=xxx)
    B->>A: GET /api/users/me  Authorization: Bearer <JWT>
    A->>A: HTTPBearer extracts token
    A->>C: GET /.well-known/jwks.json (cached 5 min TTL)
    C-->>A: JWKS public keys
    A->>A: PyJWT.decode(token, key[kid], RS256)
    A->>US: resolve_local_user(ClerkUser)
    US->>DB: SELECT WHERE clerk_user_id=?
    alt First user ever
        US->>DB: SELECT COUNT(*) → 0
        US->>DB: INSERT user (role=admin)
    else Existing user
        US-->>A: User ORM instance
    end
    A-->>B: UserOut JSON (200)
```

---

## 5. Database Schema (SQLAlchemy 2.0 / PostgreSQL 16)

```mermaid
erDiagram
    users {
        int id PK
        string clerk_user_id UK
        string email
        string first_name
        string last_name
        string image_url
        enum role "admin|user"
        timestamp created_at
    }
    profiles {
        int id PK
        int user_id FK
        string display_name
        string title
        text bio
        string avatar_url
        string github_url
        string linkedin_url
        text skills
        text projects
        bool is_public
        timestamp updated_at
    }
    data_sources {
        int id PK
        string name UK
        enum category "tech|news|crypto|stocks|sports"
        string url
        text description
        bool active
        timestamp created_at
    }
    scrape_jobs {
        int id PK
        int data_source_id FK
        int user_id FK
        enum status "pending|running|complete|failed"
        int record_count
        string storage_path
        text error
        timestamp created_at
        timestamp completed_at
    }
    feature_sets {
        int id PK
        int scrape_job_id FK
        int user_id FK
        string feature_names
        int row_count
        string storage_path
        timestamp created_at
    }
    training_runs {
        int id PK
        int feature_set_id FK
        int user_id FK
        enum status "pending|running|complete|failed"
        json metrics
        timestamp created_at
        timestamp completed_at
    }
    test_runs {
        int id PK
        int user_id FK
        enum suite_type "unit|ddt|bdd|regression|e2e"
        int total
        int passed
        int failed
        int skipped
        int duration_ms
        timestamp ran_at
    }

    users ||--o| profiles : "has"
    users ||--o{ scrape_jobs : "runs"
    users ||--o{ feature_sets : "owns"
    users ||--o{ training_runs : "triggers"
    users ||--o{ test_runs : "executes"
    data_sources ||--o{ scrape_jobs : "scraped_by"
    scrape_jobs ||--o{ feature_sets : "processed_into"
    feature_sets ||--o{ training_runs : "trained_on"
```

---

## 6. Testing — Page Object Model + Factory Boy

```mermaid
graph TB
    subgraph Suites ["5 Pytest Test Suites (tests/)"]
        UNIT["unit/ — Pure function tests (no I/O)"]
        DDT["ddt/ — @pytest.mark.parametrize data-driven"]
        BDD["bdd/ — Given/When/Then behaviour tests"]
        REG["regression/ — Historical bug guard tests"]
        E2E["e2e/ — Full HTTP request/response cycle"]
    end

    subgraph POM ["Page Object Model (tests/page_objects/)"]
        BP["BasePage — get/post/put/patch + assert helpers"]
        HP["HealthPage"] & UP["UsersPage"] & AP["AgentPage"] & GP["GraphPage"]
        BP --> HP & UP & AP & GP
    end

    subgraph FB ["Factory Boy (tests/factories/)"]
        UF["UserFactory · AdminUserFactory"]
        AF["DataSourceFactory · ScrapeJobFactory"]
        AF2["FeatureSetFactory · TrainingRunFactory · TestRunFactory"]
    end

    subgraph FX ["conftest.py Fixtures"]
        ENG["engine — session-scope SQLite+aiosqlite"]
        DBS["db_session — function-scope, rolled back"]
        AC["auth_client — mocked Clerk user"]
        ANC["anon_client — no auth"]
    end

    BDD & E2E --> POM
    UNIT & DDT & REG --> FB
    BDD & E2E --> FX
```

---

## 7. Docker — Dev vs Production

| | Dev (`docker/dev/`) | Prod (`docker/prod/`) |
|---|---|---|
| **Dockerfile** | `docker/dev/Dockerfile` | `docker/prod/Dockerfile` (multi-stage) |
| **Compose** | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| **API mode** | `uvicorn --reload --log-level debug` | `uvicorn --workers 4 --log-level info` |
| **Frontend** | Vite dev server (HMR on port 3000) | Nginx serving pre-built `/dist` |
| **Database** | Local PG container | Managed cloud DB / self-hosted PG |
| **Source** | Volume-mounted (hot reload) | COPY into image at build time |
| **Security** | Open CORS, debug=true | Tightened CSP, debug=false |
| **Python stage** | Single stage (includes dev deps) | Multi-stage: builder venv → slim runtime |

---

## 8. CI/CD Pipeline

```
push to main / typescript-backend
    │
    ├── lint-py (ruff) ─────────────────────────────────────────────► ✅
    ├── typecheck-ts (tsc --noEmit) ────────────────────────────────► ✅
    │
    ├── test-py ← needs lint-py ────────────────────────────────────► ✅
    │       ├── unit tests
    │       ├── DDT tests
    │       ├── BDD tests
    │       ├── regression tests
    │       └── E2E tests + coverage → Codecov
    │
    ├── build-ts ← needs typecheck-ts ──────────────────────────────► ✅
    │       └── uploads platform/dist artifact
    │
    ├── docker-dev ← needs test-py ─────────────────────────────────► ✅
    └── docker-prod ← needs test-py + build-ts ─────────────────────► ✅
```

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| **FastAPI over Flask/Django** | Native async/await, Pydantic v2 auto-validation, auto OpenAPI docs, fastest Python ASGI |
| **SQLAlchemy 2.0 async + asyncpg** | True async I/O, no greenlet thread pool, best PostgreSQL performance |
| **Alembic migrations** | Explicit versioned migration history; replaces Drizzle `push` (no migration files) |
| **Factory pattern (BaseService)** | All services extend `BaseService[ModelT]`; factory classmethods centralise record creation |
| **Factory Boy for tests** | Declarative, composable, Faker-backed; mirrors the TypeScript factory test pattern |
| **Page Object Model** | HTTP interactions encapsulated per router; tests read as business-language assertions |
| **SQLite + aiosqlite in tests** | In-memory isolation, rolled back per function; no live DB required in CI |
| **First user = admin** | Count users BEFORE insert; prevents race-condition role promotion bug |
| **PyJWT + JWKS cache (5 min)** | Avoids per-request Clerk roundtrip; refreshes for key rotation |
| **OpenAPI contract preserved** | Same spec → TypeScript React Query hooks work without any frontend changes |
| **Separate dev/prod Docker** | Different base images, volumes, security posture; no prod debug tools in images |
