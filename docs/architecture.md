# Synaptiq — Architecture

> Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.

## System Overview

```mermaid
graph TB
    subgraph Client["Browser Client (React + Vite)"]
        UI[Pages / Components]
        RQ[React Query hooks]
        Clerk_FE[Clerk SDK - Auth]
    end

    subgraph Proxy["Replit Reverse Proxy (path routing)"]
        PR["/  → platform:23633"]
        PA["/api → api-server:5000"]
        PK["/clerk → Clerk JWKS proxy"]
    end

    subgraph API["API Server (Express 5 + Node 24)"]
        MW_Auth[Clerk middleware - JWT verify]
        MW_RBAC[RBAC middleware - admin/user]
        R_Health[/api/healthz]
        R_Users[/api/users]
        R_Profile[/api/profile]
        R_Agent[/api/agent]
        R_Tests[/api/tests]
        R_KG[/api/knowledge-graph]
        R_Storage[/api/storage]
    end

    subgraph DB["PostgreSQL (Drizzle ORM)"]
        T_Users[(users)]
        T_Profiles[(profiles)]
        T_DataSources[(data_sources)]
        T_ScrapeJobs[(scrape_jobs)]
        T_FeatureSets[(feature_sets)]
        T_TrainingRuns[(training_runs)]
        T_TestRuns[(test_runs)]
    end

    subgraph Pipeline["Agent Pipeline (lib/agent-pipeline)"]
        Scraper[Scraper - HN / NewsAPI / CoinGecko]
        Processor[Feature Processor - CSV]
        Trainer[Trainer - trend model]
    end

    subgraph Storage["Object Storage (Replit)"]
        OS[Bucket - raw / features / models]
    end

    UI --> RQ --> Proxy
    Proxy --> API
    Proxy --> Client
    MW_Auth --> MW_RBAC --> R_Users & R_Profile & R_Agent & R_Tests & R_KG
    R_Agent --> Pipeline --> OS
    R_Agent & R_Users & R_Profile & R_Tests & R_KG --> DB
```

## Service Ports

| Service        | Port  | Path  | Description                      |
|---------------|-------|-------|----------------------------------|
| api-server    | 5000  | /api  | Express REST API + Clerk proxy   |
| platform      | 23633 | /     | React SPA (Vite dev server)      |

## Package Layout

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/      # Express 5 backend (TypeScript, esbuild → CJS)
│   └── platform/        # React 18 + Vite SPA
├── lib/
│   ├── agent-pipeline/  # Scrape / process / train logic (TypeScript)
│   ├── api-client-react/# Generated React Query hooks (Orval)
│   ├── api-spec/        # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-zod/         # Generated Zod schemas (Orval)
│   ├── db/              # Drizzle ORM schema + client
│   └── object-storage-web/ # Replit object storage client
├── scripts/             # CLI tools (agentCli.ts)
├── utils/               # Shell / PowerShell dev utilities
├── docker/              # Docker Compose + Nginx config
├── docs/                # Architecture, schema, API docs
└── .github/workflows/   # CI/CD (ci.yml, deploy-production.yml, codeql.yml)
```

## Data Flow — Agent Pipeline

```mermaid
sequenceDiagram
    actor User
    participant API as API Server
    participant Pipeline as Agent Pipeline
    participant Storage as Object Storage
    participant DB as PostgreSQL

    User->>API: POST /api/agent/scrape {source, path}
    API->>DB: Insert scrape_job (status=pending)
    API->>Pipeline: scrapeDataSource(source)
    Pipeline-->>API: ScrapedRecords[]
    API->>Storage: Upload raw NDJSON
    API->>DB: Update scrape_job (status=complete, recordCount)
    API-->>User: ScrapeJob {id, status, recordCount}

    User->>API: POST /api/agent/process {scrapeJobId, features}
    API->>Storage: Download raw file
    API->>Pipeline: processRecords(records, featureNames)
    Pipeline-->>API: FeatureRow[] (CSV)
    API->>Storage: Upload feature CSV
    API->>DB: Insert feature_set
    API-->>User: FeatureSet {id, path, rowCount}

    User->>API: POST /api/agent/train {featureSetId}
    API->>Storage: Download feature CSV
    API->>Pipeline: trainOnFeatureRows(rows)
    Pipeline-->>API: TrainingRunMetrics
    API->>DB: Insert training_run
    API-->>User: TrainingRun {id, metrics}
```

## Authentication & RBAC

```mermaid
flowchart LR
    A[Request] --> B{Has Bearer JWT?}
    B -- No --> C[401 Unauthorized]
    B -- Yes --> D[Clerk verifyToken]
    D -- Invalid --> C
    D -- Valid --> E[resolveLocalUser]
    E -- New user --> F[INSERT users - role=user]
    E -- First user ever --> G[INSERT users - role=admin]
    E --> H{Route requires admin?}
    H -- No --> I[Handler]
    H -- Yes --> J{role === admin?}
    J -- No --> K[403 Forbidden]
    J -- Yes --> I
```

## Knowledge Graph Schema

```mermaid
erDiagram
    KNOWLEDGE_GRAPH_NODE {
        string id
        string label
        string entityType
        json   detail
    }
    KNOWLEDGE_GRAPH_EDGE {
        string source
        string target
        string relation
    }
    KNOWLEDGE_GRAPH_NODE ||--o{ KNOWLEDGE_GRAPH_EDGE : "source"
    KNOWLEDGE_GRAPH_NODE ||--o{ KNOWLEDGE_GRAPH_EDGE : "target"
```

## Database Schema

```mermaid
erDiagram
    USERS {
        serial  id PK
        text    clerk_user_id UK
        text    email
        text    first_name
        text    last_name
        text    image_url
        enum    role
        ts      created_at
    }
    PROFILES {
        serial  id PK
        int     user_id FK
        text    display_name
        text    title
        text    bio
        text    avatar_url
        text    github_url
        text    linkedin_url
        text    skills
        text    projects
        ts      updated_at
    }
    DATA_SOURCES {
        serial  id PK
        text    name UK
        text    category
        text    url
        text    description
        bool    active
        ts      created_at
    }
    SCRAPE_JOBS {
        serial  id PK
        int     data_source_id FK
        int     user_id FK
        enum    status
        int     record_count
        text    storage_path
        text    error
        ts      created_at
        ts      completed_at
    }
    FEATURE_SETS {
        serial  id PK
        int     scrape_job_id FK
        int     user_id FK
        text    feature_names
        int     row_count
        text    storage_path
        ts      created_at
    }
    TRAINING_RUNS {
        serial  id PK
        int     feature_set_id FK
        int     user_id FK
        enum    status
        json    metrics
        ts      created_at
        ts      completed_at
    }
    TEST_RUNS {
        serial  id PK
        int     user_id FK
        enum    suite_type
        int     total
        int     passed
        int     failed
        int     skipped
        int     duration_ms
        ts      ran_at
    }

    USERS ||--o{ PROFILES : "has"
    USERS ||--o{ SCRAPE_JOBS : "runs"
    USERS ||--o{ FEATURE_SETS : "creates"
    USERS ||--o{ TRAINING_RUNS : "owns"
    USERS ||--o{ TEST_RUNS : "triggers"
    DATA_SOURCES ||--o{ SCRAPE_JOBS : "feeds"
    SCRAPE_JOBS ||--o{ FEATURE_SETS : "processed into"
    FEATURE_SETS ||--o{ TRAINING_RUNS : "trains"
```

## Security Protocols

| Layer                  | Control                                                       |
|------------------------|---------------------------------------------------------------|
| Auth                   | Clerk-issued JWTs, verified server-side on every request      |
| Transport              | HTTPS enforced (Replit proxy + Nginx TLS in production)       |
| RBAC                   | `requireAuth` + `requireAdmin` Express middleware             |
| Supply-chain           | `minimumReleaseAge: 1440` in pnpm-workspace.yaml             |
| SAST                   | GitHub CodeQL on push / weekly schedule                       |
| Secrets                | Never in source — loaded via Replit Secrets or `.env.local`   |
| DB access              | Server-only via Drizzle; no direct DB exposure to browser     |
| CORS                   | `credentials: true, origin: true` (same-domain proxy)        |
| HTTP headers           | Nginx: X-Frame-Options, X-Content-Type-Options, CSP           |
| Docker                 | Non-root user (`synaptiq`), health checks, minimal Alpine base|
