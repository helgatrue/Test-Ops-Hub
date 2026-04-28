# Workspace

## Overview

pnpm workspace monorepo. The frontend is Angular 21, the API is Java Spring Boot, and the database is PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

### Frontend (`artifacts/angular-frontend`)
- **Framework**: Angular 21 (standalone components, signals, lazy-loaded routes)
- **Styling**: Custom CSS design system (`.card`, `.btn`, `.badge`, `.sidebar`, etc.) + Tailwind v4 via `@tailwindcss/postcss`
- **Charts**: Chart.js (Line chart for pass rate trend)
- **HTTP**: Angular `HttpClient` (relative paths to `/api/...`)
- **Routing**: Angular Router with lazy-loaded page components
- **State**: Angular signals
- **Served via**: `artifacts/test-management` artifact at path `/`
- **Dev command**: `pnpm --filter @workspace/angular-frontend run dev`

### API Server (`artifacts/api-server/spring-boot`)
- **Language**: Java 19 (GraalVM)
- **Framework**: Spring Boot 3.2.5
- **Web server**: Embedded Apache Tomcat 10.1.20
- **ORM**: Hibernate 6.4 via Spring Data JPA
- **Database**: PostgreSQL (HikariCP connection pool)
- **Build tool**: Maven 3.8.6

### Shared Libraries
- `lib/db` — Drizzle ORM schema definitions (PostgreSQL) — used for DB migrations only

## Key Commands

- `pnpm --filter @workspace/angular-frontend run dev` — start Angular frontend
- `cd artifacts/api-server/spring-boot && mvn spring-boot:run` — run Spring Boot API server locally
- `cd artifacts/api-server/spring-boot && mvn compile` — compile the Java source

## Angular Frontend Layout

```
artifacts/angular-frontend/src/app/
  app.ts                    # Root component (hosts toast container)
  app.config.ts             # App config (HttpClient, Router)
  app.routes.ts             # All lazy-loaded routes
  services/
    api.service.ts          # All HTTP calls to /api/...
    toast.service.ts        # Signal-based toast notifications
  components/
    layout/
      app-layout.ts + .html # Dark sidebar, collapsible projects tree, router-outlet
  pages/
    dashboard/              # Dashboard with Chart.js trend, stats, recent runs
    projects/
      list/                 # Project cards grid
      new/                  # Create project form
      detail/               # Tabs: test cases table + test runs table, CRUD modals
    test-cases/
      new/                  # Create test case with steps & labels
      edit/                 # Edit test case
      detail/               # View test case steps and metadata
    test-runs/
      new/                  # Select test cases and start run
      detail/               # View results, update statuses, download HTML report
    settings/               # Settings page
    not-found/              # 404 page
```

## API Endpoints

All routes served under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET/POST | /api/projects | List / create projects |
| GET/PUT/DELETE | /api/projects/:id | Get / update / delete project |
| GET/POST | /api/projects/:id/test-cases | List / create test cases |
| GET/PUT/DELETE | /api/projects/:id/test-cases/:tcId | Get / update / delete test case |
| GET/POST | /api/projects/:id/test-runs | List / create test runs |
| GET | /api/projects/:id/test-runs/:runId | Get test run with results |
| PATCH | /api/projects/:id/test-runs/:runId/results/:rId | Update test result status |
| GET | /api/dashboard/summary | Dashboard summary stats |
| GET | /api/dashboard/recent-runs | Recent test runs |
| GET | /api/dashboard/pass-rate-trend | 30-day pass rate trend |
| GET | /api/dashboard/top-failing-tests | Most frequently failing tests |

## Java Source Layout

```
artifacts/api-server/spring-boot/src/main/java/com/testops/api/
  TestOpsApplication.java       # Spring Boot entry point
  config/
    DataSourceConfig.java       # Parses DATABASE_URL → HikariCP
    CorsConfig.java             # Allow all origins
  entity/                       # JPA entities (Project, TestCase, TestRun, TestResult)
  converter/                    # Jackson-based JSONB converters (labels, steps)
  dto/                          # Request/response DTOs + Step record
  repository/                   # Spring Data JPA repositories
  controller/                   # REST controllers (one per resource)
```

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
