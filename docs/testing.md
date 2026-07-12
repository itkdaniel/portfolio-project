# Synaptiq — Testing Guide

> Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.

## Test Philosophy

Synaptiq tests follow the **Page Object Model (POM)** pattern for E2E tests
and **Factory optimization** for unit/DDT/BDD fixtures. The test pyramid has
five suite categories:

| Suite       | Focus                                    | Tool    | Count |
|-------------|------------------------------------------|---------|-------|
| `unit`      | Pure function / business logic           | Vitest  | ~5    |
| `ddt`       | Data-Driven Tests — multiple input sets  | Vitest  | ~4    |
| `bdd`       | Behaviour scenarios (Given/When/Then)    | Vitest  | ~5    |
| `regression`| Previous bug reproducers                 | Vitest  | ~4    |
| `e2e`       | Full HTTP stack against Express router   | Vitest  | ~3    |

## Running Tests

```bash
# All suites
pnpm --filter @workspace/api-server run test

# Single suite
pnpm --filter @workspace/api-server run test -- --grep unit

# Watch mode
pnpm --filter @workspace/api-server run test -- --watch

# Shell helper
./utils/run-tests.sh
SUITE=bdd ./utils/run-tests.sh
WATCH=1 ./utils/run-tests.sh
```

## Factory Pattern

Test fixtures are created via factory functions that produce minimal, valid
objects and allow partial overrides — the same concept as Python `factory_boy`.

```typescript
// Example: UserFactory
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkUserId: "user_test_abc",
    email: "test@synaptiq.app",
    role: "user",
    createdAt: new Date(),
    ...overrides,
  };
}

// DDT: same factory, different inputs
test.each([
  makeUser({ role: "admin" }),
  makeUser({ role: "user" }),
])("role check: $role", (user) => { ... });
```

## Page Object Model (E2E)

For browser-level E2E tests (Playwright), each page is encapsulated in a
**Page Object** class that owns the selectors and actions for that page.

```typescript
// Example: DashboardPage (Page Object)
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async getPipelineCard() {
    return this.page.getByTestId("pipeline-card");
  }

  async clickRunScrape() {
    await this.page.getByRole("button", { name: /run scrape/i }).click();
  }
}

// Usage in test
test("dashboard shows pipeline card", async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await expect(dashboard.getPipelineCard()).toBeVisible();
});
```

## Test File Location

```
artifacts/api-server/src/tests/
├── unit.test.ts        # Pure logic tests
├── ddt.test.ts         # Data-driven tests
├── bdd.test.ts         # BDD scenarios
├── regression.test.ts  # Regression tests
└── e2e.test.ts         # Full HTTP stack tests
```

## CI Integration

All suites run automatically on every push and pull request via
`.github/workflows/ci.yml`. The test job requires the `install` job to
complete first and injects `DATABASE_URL`, `CLERK_SECRET_KEY`, and
`SESSION_SECRET` from GitHub Secrets.

See the **CI/CD** section of `README.md` for full configuration details.
