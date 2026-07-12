# Synaptiq — API Reference

> Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
> Full OpenAPI 3.1 spec: `lib/api-spec/openapi.yaml`

## Base URL

| Environment | URL                         |
|-------------|-----------------------------|
| Development | `http://localhost:5000/api`  |
| Production  | `https://<domain>/api`      |

## Authentication

All protected endpoints require a Clerk JWT in the `Authorization` header:

```
Authorization: Bearer <clerk_session_token>
```

Tokens are verified server-side via the Clerk SDK on every request.

## Endpoints

### Health

| Method | Path           | Auth | Description        |
|--------|----------------|------|--------------------|
| GET    | /api/healthz   | No   | Liveness check     |

---

### Users (RBAC)

| Method | Path                   | Auth          | Description              |
|--------|------------------------|---------------|--------------------------|
| GET    | /api/users             | Admin         | List all users           |
| GET    | /api/users/me          | User          | Get current user         |
| PATCH  | /api/users/:id/role    | Admin         | Update a user's role     |

---

### Profile

| Method | Path                        | Auth   | Description                    |
|--------|-----------------------------|--------|--------------------------------|
| GET    | /api/profile/me             | User   | Get my profile                 |
| PUT    | /api/profile/me             | User   | Update my profile              |
| GET    | /api/profile/public         | User   | List all public profiles       |
| GET    | /api/profile/public/:userId | User   | Get one user's public profile  |

---

### Agent Pipeline

| Method | Path                          | Auth   | Description                 |
|--------|-------------------------------|--------|-----------------------------|
| GET    | /api/agent/data-sources       | User   | List trending data sources  |
| POST   | /api/agent/scrape             | User   | Run a scrape job            |
| GET    | /api/agent/scrape             | User   | List scrape jobs            |
| GET    | /api/agent/scrape/:id         | User   | Get scrape job detail       |
| POST   | /api/agent/process            | User   | Process scraped data        |
| GET    | /api/agent/feature-sets       | User   | List feature sets           |
| GET    | /api/agent/feature-sets/:id   | User   | Get feature set detail      |
| POST   | /api/agent/train              | User   | Run training on feature set |
| GET    | /api/agent/training-runs      | User   | List training runs          |
| GET    | /api/agent/training-runs/:id  | User   | Get training run detail     |

---

### Tests

| Method | Path                | Auth   | Description              |
|--------|---------------------|--------|--------------------------|
| POST   | /api/tests/run      | Admin  | Run a test suite         |
| GET    | /api/tests          | User   | List test run history    |

---

### Knowledge Graph

| Method | Path                    | Auth   | Description               |
|--------|-------------------------|--------|---------------------------|
| GET    | /api/knowledge-graph    | User   | Get live knowledge graph  |

---

### Storage

| Method | Path                   | Auth   | Description              |
|--------|------------------------|--------|--------------------------|
| POST   | /api/storage/upload-url| User   | Get pre-signed upload URL|

## Error Envelope

All errors return:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning                        |
|--------|--------------------------------|
| 400    | Bad request / validation error |
| 401    | Missing or invalid JWT         |
| 403    | Insufficient role              |
| 404    | Resource not found             |
| 500    | Internal server error          |
