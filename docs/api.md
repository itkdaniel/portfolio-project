# Synaptiq — API Reference (v2.0.0 Python FastAPI)

> Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.
> Interactive docs (dev): `GET /api/docs` (Swagger UI) · `GET /api/redoc`
> OpenAPI 3.1 spec: `lib/api-spec/openapi.yaml`

---

## Base URL

| Environment | Base URL |
|---|---|
| Development (Replit) | `https://<repl-domain>/api` |
| Development (Docker) | `http://localhost:8080/api` |
| Production | `https://<domain>/api` |

---

## Authentication

All endpoints (except `/api/healthz`) require a Clerk JWT in the Authorization header:

```
Authorization: Bearer <clerk_jwt>
```

The backend verifies the RS256 JWT against Clerk's JWKS (cached 5 min).

**First request creates the user JIT.** The very first user created gets the `admin` role automatically.

---

## Error Envelope

All errors return:

```json
{ "detail": "Human-readable error message" }
```

Standard HTTP status codes: `400` bad request · `401` unauthorized · `403` forbidden · `404` not found · `422` validation error · `500` internal error.

---

## Endpoints

### Health

#### `GET /api/healthz`
Liveness check. No auth required.

**Response 200:**
```json
{ "status": "ok", "version": "2.0.0", "service": "synaptiq-api" }
```

---

### Users

#### `GET /api/users/me`
Get the current authenticated user. Creates a DB record JIT on first call.

**Response 200:**
```json
{
  "id": 1,
  "clerk_user_id": "user_abc123",
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "image_url": "https://avatars.example.com/user_abc123",
  "role": "user",
  "created_at": "2026-07-16T00:00:00Z"
}
```

#### `GET /api/users/` *(admin only)*
List all users ordered by creation date.

**Response 200:**
```json
{ "users": [...], "total": 5 }
```

#### `PATCH /api/users/{user_id}/role` *(admin only)*
Update a user's RBAC role.

**Body:**
```json
{ "role": "admin" }
```

**Response 200:** Updated `UserOut`

---

### Profile

#### `GET /api/profile/me`
Get the current user's resume profile. Creates an empty profile JIT.

#### `PUT /api/profile/me`
Update the current user's profile.

**Body:**
```json
{
  "display_name": "Jane Doe",
  "title": "Senior Engineer",
  "bio": "Builder of things.",
  "avatar_url": "https://example.com/avatar.png",
  "github_url": "https://github.com/janedoe",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "skills": "[\"Python\", \"FastAPI\", \"TypeScript\"]",
  "projects": "[]",
  "is_public": true
}
```

#### `GET /api/profile/public`
List all public profiles (is_public=true).

#### `GET /api/profile/public/{user_id}`
Get a specific public profile by user ID.

---

### Agent Pipeline

#### `GET /api/agent/data-sources`
List all active data sources. Seeds the registry JIT on first call.

**Response 200:**
```json
[
  { "id": 1, "name": "hacker-news", "category": "tech", "url": "...", "description": "...", "active": true }
]
```

#### `POST /api/agent/scrape`
Run a scrape job against a named data source.

**Body:**
```json
{ "source": "hacker-news", "path": "raw" }
```

**Response 200:** `ScrapeJobOut`
```json
{
  "id": 1,
  "data_source_id": 1,
  "user_id": 1,
  "status": "complete",
  "record_count": 20,
  "storage_path": "raw/hacker-news-1.ndjson",
  "error": null,
  "created_at": "2026-07-16T00:00:00Z",
  "completed_at": "2026-07-16T00:00:01Z"
}
```

Sources: `hacker-news` · `coin-gecko` · `crypto-panic`

#### `GET /api/agent/scrape`
List all scrape jobs for the current user.

#### `POST /api/agent/process`
Process a completed scrape job into a feature set.

**Body:**
```json
{ "scrape_job_id": 1, "feature_names": ["title", "score", "category"] }
```

**Response 200:** `FeatureSetOut`

#### `GET /api/agent/feature-sets`
List all feature sets for the current user.

#### `POST /api/agent/train`
Train a trend model on a feature set.

**Body:**
```json
{ "feature_set_id": 1 }
```

**Response 200:** `TrainingRunOut`
```json
{
  "id": 1,
  "feature_set_id": 1,
  "status": "complete",
  "metrics": {
    "accuracy": 0.92,
    "loss": 0.08,
    "epochs": 20,
    "samples": 20,
    "feature_importances": { "title": 0.5, "score": 0.3, "category": 0.2 }
  },
  "created_at": "...",
  "completed_at": "..."
}
```

#### `GET /api/agent/training-runs`
List all training runs for the current user.

---

### Tests

#### `POST /api/tests/run` *(admin only)*
Run a pytest test suite and persist the result.

**Body:**
```json
{ "suite_type": "unit" }
```

Suite types: `unit` · `ddt` · `bdd` · `regression` · `e2e`

**Response 200:** `TestRunOut`

#### `GET /api/tests/`
List the last 100 test run records.

---

### Knowledge Graph

#### `GET /api/knowledge-graph/`
Returns the platform's live relational data as a force-directed graph payload.

**Response 200:**
```json
{
  "nodes": [
    { "id": "user:1", "label": "user@example.com", "entity_type": "user", "detail": {"role": "admin"} },
    { "id": "data_source:1", "label": "hacker-news", "entity_type": "data_source", "detail": {"category": "tech"} }
  ],
  "edges": [
    { "source": "user:1", "target": "scrape_job:1", "relation": "ran_by" },
    { "source": "scrape_job:1", "target": "data_source:1", "relation": "scrapes" }
  ]
}
```

Node entity types: `user` · `data_source` · `scrape_job` · `feature_set` · `training_run`
Edge relations: `ran_by` · `scrapes` · `processed_into` · `trained_on`

---

### Storage

#### `POST /api/storage/upload-url`
Get a pre-signed URL for direct client-side object uploads.

**Body:**
```json
{ "filename": "data.csv", "content_type": "text/csv" }
```

**Response 200:**
```json
{ "upload_url": "/api/storage/local/private/data.csv", "object_path": "private/data.csv" }
```
