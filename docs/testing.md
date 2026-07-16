# Synaptiq — Testing Guide (v2.0.0 Python)

> Copyright © 2026 Synaptic Applications (Itkdaniel). MIT License.

## Test Philosophy

All backend tests use **pytest** with two complementary patterns:

1. **Page Object Model (POM)** — encapsulate every HTTP endpoint interaction in a typed page object so tests read as business-language assertions, not raw HTTP calls.
2. **Factory Boy** — declarative, composable test-data factories that replace boilerplate `INSERT` setup and make test intent obvious.

Tests run against an **in-memory SQLite database** (via `aiosqlite`) so no running PostgreSQL is needed locally or in CI. Each test function gets a fresh session that is rolled back on completion.

---

## Test Suites

| Suite | Directory | Focus | Pattern |
|---|---|---|---|
| Unit | `tests/unit/` | Pure functions — no I/O | Factory Boy + direct calls |
| DDT | `tests/ddt/` | Parametrized data-driven | `@pytest.mark.parametrize` |
| BDD | `tests/bdd/` | Given/When/Then behaviours | Page Object Model |
| Regression | `tests/regression/` | Guard against known bugs | Factory Boy + direct calls |
| E2E | `tests/e2e/` | Full HTTP request/response | Page Object Model |

---

## Running Tests

```bash
# All suites
cd artifacts/api-server
python -m pytest tests/ -v

# Individual suite
python -m pytest tests/unit/ -v
python -m pytest tests/ddt/ -v
python -m pytest tests/bdd/ -v
python -m pytest tests/regression/ -v
python -m pytest tests/e2e/ -v

# With coverage
python -m pytest tests/ --cov=src --cov-report=term-missing

# Watch mode (re-runs on file change)
python -m pytest tests/ -f
```

---

## Page Object Model

Every API router has a corresponding Page Object in `tests/page_objects/`. Each class extends `BasePage` and wraps raw HTTP calls in typed helpers.

### BasePage

```python
# tests/page_objects/base_page.py
class BasePage:
    BASE_PATH = "/api"

    def __init__(self, client: AsyncClient) -> None:
        self.client = client
        self.last_response: Response | None = None

    async def get(self, path="", **kwargs) -> Response: ...
    async def post(self, path="", **kwargs) -> Response: ...

    def assert_ok(self, status=200) -> "BasePage": ...
    def json(self) -> Any: ...
```

### Example Page Object

```python
# tests/page_objects/users_page.py
class UsersPage(BasePage):
    BASE_PATH = "/api/users"

    async def get_me(self):
        return await self.get("/me")

    async def update_role(self, user_id: int, role: str):
        return await self.patch(f"/{user_id}/role", json={"role": role})

    def assert_user_shape(self) -> "UsersPage":
        data = self.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
        return self
```

### Using Page Objects in Tests

```python
# tests/e2e/test_e2e.py
async def test_user_me_returns_jit_created_user(self, auth_client: AsyncClient):
    page = UsersPage(auth_client)
    await page.get_me()
    page.assert_ok(200).assert_user_shape()
    assert page.json()["clerk_user_id"] == "user_test_123"
```

---

## Factory Boy

Test data factories live in `tests/factories/`. All factories use Factory Boy with Faker for realistic data.

### User Factories

```python
# tests/factories/user_factory.py
class UserFactory(factory.Factory):
    class Meta:
        model = User

    id = factory.Sequence(lambda n: n + 1)
    clerk_user_id = factory.LazyAttribute(lambda o: f"user_clerk_{o.id}")
    email = Faker("email")
    first_name = Faker("first_name")
    role = UserRole.user

class AdminUserFactory(UserFactory):
    role = UserRole.admin
    email = "admin@synaptiq.dev"
```

### Using Factories in Tests

```python
# Build in-memory (no DB)
user = UserFactory()
admin = AdminUserFactory()
users = UserFactory.build_batch(5)

# Override specific fields
user = UserFactory(email="custom@test.com", role=UserRole.admin)
```

---

## Fixtures (conftest.py)

| Fixture | Scope | Description |
|---|---|---|
| `engine` | session | Shared SQLite async engine; schema created once |
| `db_session` | function | Rolled-back session per test |
| `app` | function | FastAPI app with `db_session` injected |
| `auth_client` | function | `AsyncClient` with mocked Clerk user |
| `anon_client` | function | `AsyncClient` with no auth |

### Mock Clerk User

The `auth_client` fixture overrides `get_current_clerk_user` to return a fixed `ClerkUser` without hitting Clerk's JWKS API:

```python
mock_clerk_user = ClerkUser({
    "sub": "user_test_123",
    "email": "test@synaptiq.dev",
    "first_name": "Test",
    "last_name": "User",
})
app.dependency_overrides[get_current_clerk_user] = lambda: mock_clerk_user
```

---

## DDT Pattern

Data-driven tests use `@pytest.mark.parametrize` to verify logic across many input combinations:

```python
@pytest.mark.parametrize("line,expected", [
    ("a,b,c", ["a", "b", "c"]),
    ('"hello, world",b', ["hello, world", "b"]),
    ('"say ""hi""",x', ['say "hi"', "x"]),
    ("single", ["single"]),
    ("", []),
    ("a,,c", ["a", "", "c"]),
])
def test_parse_csv_line_parametrized(line: str, expected: list):
    result = parse_csv_line(line)
    assert result == expected
```

---

## BDD Pattern

BDD tests document system behaviours in human-readable Given/When/Then form using Page Objects:

```python
class TestAuthBehaviour:
    """
    Feature: Clerk JWT authentication
      As a platform user
      I want my requests authenticated via Clerk
      So that my data is secure
    """

    async def test_given_valid_jwt_when_get_me_then_returns_user(
        self, auth_client: AsyncClient
    ):
        # Given: a valid Clerk JWT (mocked in conftest)
        page = UsersPage(auth_client)
        # When: GET /api/users/me is called
        await page.get_me()
        # Then: returns 200 with user shape
        page.assert_ok(200).assert_user_shape()
```

---

## Regression Tests

Each regression test is annotated with the specific bug it prevents:

```python
class TestCsvRegressions:
    def test_quoted_comma_not_corrupted(self):
        """
        Regression: Using str.split(",") corrupts fields containing commas.
        Fix: Always use csv.reader (src/agent/csv_utils.py).
        """
        line = '"New York, NY",100'
        fields = parse_csv_line(line)
        assert len(fields) == 2
        assert fields[0] == "New York, NY"
```

---

## CI Integration

All 5 suites run sequentially in GitHub Actions (`ci.yml`):

```yaml
- name: Unit tests
  run: python -m pytest tests/unit/ -v --tb=short

- name: DDT tests
  run: python -m pytest tests/ddt/ -v --tb=short

- name: BDD tests
  run: python -m pytest tests/bdd/ -v --tb=short

- name: Regression tests
  run: python -m pytest tests/regression/ -v --tb=short

- name: E2E tests
  run: python -m pytest tests/e2e/ -v --tb=short

- name: Coverage (all suites)
  run: python -m pytest tests/ --cov=src --cov-report=xml
```

Coverage XML is uploaded to Codecov after every CI run.
