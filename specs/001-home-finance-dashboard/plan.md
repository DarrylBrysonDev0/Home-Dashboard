# Implementation Plan: Home Finance Dashboard

**Branch**: `001-home-finance-dashboard` | **Date**: 2026-01-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-home-finance-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Develop a comprehensive Home Finance Dashboard that provides real-time financial health monitoring through interactive visualizations, KPI metrics, and transaction tracking. The dashboard will enable homeowners to understand their cash flow patterns, spending by category, account balance trends, and recurring expenses through an accessible, desktop-first web interface built with Next.js 14+ App Router, TypeScript, Prisma ORM, and MSSQL Server 2025, following TDD methodology with Red-Green-Refactor cycle.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled, Node.js 18+  
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Prisma 5.7+ ORM, Tailwind CSS, shadcn/ui, Recharts, TanStack Table, React Hook Form, Zod, Lucide React  
**Storage**: MSSQL Server 2025 (Docker container, port 1434), existing database `HomeFinance-db` with 1,117 transactions  
**Testing**: Vitest + React Testing Library + Playwright + Testcontainers (see [research.md](research.md) for details)  
**Target Platform**: Linux Docker environment, modern evergreen browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Web application (Next.js App Router with Server/Client Components)  
**Performance Goals**: Dashboard load <3s, filter refresh <1s, chart render <2s, CSV export <5s for 5K records  
**Constraints**: Desktop-primary viewport (1024px+) with basic tablet support (768px-1023px), WCAG AA contrast compliance (4.5:1 for text, 3:1 for UI), single-user personal use  
**Scale/Scope**: ~10K transactions capacity, 8 user stories (3 P1, 3 P2, 2 P3), ~15 categories, 6 accounts, 15+ API endpoints, ~20 React components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Component-First Architecture ✅ PASS
- **Status**: Compliant
- **Evidence**: Spec requires React components for charts, KPIs, tables, filters. UI built with shadcn/ui in `components/ui/`, feature components in `components/[feature]/`. Server/Client Components explicit per Next.js 14 App Router.
- **Risk**: None

### Principle II: Type Safety (NON-NEGOTIABLE) ✅ PASS
- **Status**: Compliant
- **Evidence**: TypeScript 5.3+ strict mode mandated. Zod schemas required for forms, API validation (FR-004, FR-007). Prisma types for database entities. Constitution explicitly forbids `any` type.
- **Risk**: None

### Principle III: Database-First Design ✅ PASS
- **Status**: Compliant
- **Evidence**: MSSQL database already initialized with schema (`transactions` table). Spec defines entities (Account, Transaction, Category). Prisma will be used as single source of truth. Database exists before implementation.
- **Risk**: None

### Principle IV: API Contract Clarity ✅ PASS
- **Status**: Compliant
- **Evidence**: Spec requires API routes with Zod validation, consistent response shapes, REST conventions. API contracts in `/contracts/` directory (Phase 1 output). All endpoints have explicit input/output types.
- **Risk**: None

### Principle V: MVP-First, Iterate Second ✅ PASS
- **Status**: Compliant
- **Evidence**: User stories prioritized (P1/P2/P3). P1 stories (6) deliver standalone value. P3 stories deferrable. TDD approach ensures incremental development. No premature optimization - performance goals are realistic (<3s load, <1s filter).
- **Risk**: None

### Technology Stack Compliance ✅ PASS
- **Core Stack**: Next.js 14+ ✅, TypeScript 5.3+ ✅, Prisma 5.7+ ✅, MSSQL Server 2025 ✅
- **UI/Styling**: Tailwind CSS ✅, shadcn/ui ✅, Lucide React ✅, clsx + tailwind-merge ✅
- **Data/Forms**: Zod ✅, React Hook Form ✅, Recharts ✅, TanStack Table ✅, sonner ✅
- **Optional**: TanStack Query (defer to Server Components for MVP), NextAuth (single-user, skip for MVP), date-fns ✅
- **Infrastructure**: Docker ✅, Linux/bash ✅, Git ✅

### TDD Methodology Compliance ✅ PASS
- **Status**: Compliant
- **Evidence**: Spec mandates TDD Red-Green-Refactor cycle (Development Methodology section). Each user story acceptance scenario maps to test cases. Test categories defined (Unit, Integration, E2E). Minimum 80% coverage for business logic, 100% for P1 acceptance scenarios.
- **Risk**: Testing framework needs selection (see NEEDS CLARIFICATION in Technical Context)

### Overall Gate Status: ✅ **PASS - No violations, proceed to Phase 0**

## Project Structure

### Documentation (this feature)

```text
specs/001-home-finance-dashboard/
├── spec.md              # Feature specification (USER INPUT)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── transactions-api.yaml
│   ├── analytics-api.yaml
│   └── filters-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
Home-Dashboard/
├── app/
│   ├── api/
│   │   ├── transactions/
│   │   │   ├── route.ts           # GET, POST transactions
│   │   │   └── [id]/route.ts      # GET, PUT, DELETE by ID
│   │   ├── analytics/
│   │   │   ├── kpis/route.ts      # Net cash flow, balance, MoM change
│   │   │   ├── cash-flow/route.ts # Income vs expenses over time
│   │   │   ├── categories/route.ts # Spending breakdown
│   │   │   ├── accounts/route.ts  # Account balance trends
│   │   │   ├── recurring/route.ts # Recurring transaction detection
│   │   │   └── transfers/route.ts # Transfer flow between accounts
│   │   ├── filters/
│   │   │   ├── accounts/route.ts  # List accounts
│   │   │   └── date-ranges/route.ts # Quick select + custom ranges
│   │   └── export/
│   │       └── csv/route.ts       # Export transactions to CSV
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout with filters
│   │   └── page.tsx               # Main dashboard page (Server Component)
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home/landing page
├── components/
│   ├── ui/                        # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── kpi-cards.tsx          # Net cash flow, balance, MoM
│   │   ├── filters/
│   │   │   ├── time-filter.tsx    # Quick select + custom date range
│   │   │   └── account-filter.tsx # Multi-select accounts
│   │   ├── charts/
│   │   │   ├── cash-flow-chart.tsx      # Income vs expenses (Recharts)
│   │   │   ├── category-donut.tsx       # Spending donut chart
│   │   │   ├── category-bar.tsx         # Spending bar chart
│   │   │   ├── balance-trends.tsx       # Account balance multi-line
│   │   │   └── transfer-flow.tsx        # Sankey/flow diagram
│   │   ├── transactions/
│   │   │   ├── transaction-table.tsx    # TanStack Table with sort/filter
│   │   │   └── recurring-table.tsx      # Recurring transactions view
│   │   └── empty-states/
│   │       └── no-data.tsx              # Empty state component
│   └── icons/                     # Custom icons if needed
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── utils.ts                   # clsx + tailwind-merge utilities
│   ├── validations/
│   │   ├── transaction.ts         # Zod schemas for transactions
│   │   ├── filters.ts             # Zod schemas for filters
│   │   └── analytics.ts           # Zod schemas for analytics params
│   ├── queries/
│   │   ├── transactions.ts        # Prisma queries for transactions
│   │   ├── analytics.ts           # Complex aggregation queries
│   │   └── recurring.ts           # Recurring detection algorithm
│   └── constants/
│       ├── colors.ts              # Chart color palette
│       └── date-ranges.ts         # Quick select time periods
├── prisma/
│   ├── schema.prisma              # Database schema (sync with existing DB)
│   └── migrations/                # Migration history
├── __tests__/
│   ├── unit/
│   │   ├── queries/               # Unit tests for queries
│   │   ├── validations/           # Unit tests for Zod schemas
│   │   └── components/            # Component unit tests
│   ├── integration/
│   │   ├── api/                   # API route integration tests
│   │   └── db/                    # Database query integration tests
│   └── e2e/
│       ├── user-story-1.spec.ts   # Financial health summary E2E
│       ├── user-story-2.spec.ts   # Cash flow over time E2E
│       └── ...
├── .specify/
│   ├── memory/
│   │   └── constitution.md        # Project constitution
│   └── templates/                 # Spec templates
├── specs/                         # Feature specifications
│   └── 001-home-finance-dashboard/
├── research/                      # Technical research
├── docker-compose.yml             # Database + app orchestration
├── Dockerfile                     # Next.js container
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration (strict mode)
├── package.json                   # Dependencies
└── .env.local                     # Environment variables (DATABASE_URL)
```

**Structure Decision**: Web application with Next.js App Router structure. API routes in `app/api/` following REST conventions. Components organized by feature in `components/dashboard/`. Prisma schema in `prisma/` directory. Tests organized by type (unit/integration/e2e) mirroring source structure. Docker setup for database and optional app containerization.

---

## Phase 0: Research & Technical Decisions

**Status**: ✅ Completed

See [research.md](research.md) for detailed research findings and technical decisions.

**Key Decisions**:
- **Testing Framework**: Vitest + React Testing Library + Playwright + Testcontainers
- **Test Database**: Ephemeral MSSQL containers for isolation
- **Prisma Strategy**: Introspect existing DB + manual indexes + raw SQL for complex analytics
- **Charts**: Recharts with responsive containers and WCAG AA palette
- **Transaction Table**: TanStack Table v8 with client-side filtering
- **Date Filters**: Quick-select buttons + shadcn Calendar popover
- **Recurring Detection**: Rule-based pattern matching with confidence scoring
- **Transfer Visualization**: Recharts Sankey diagram

---

## Phase 1: Design & Contracts

**Status**: ✅ Completed

### Data Model

See [data-model.md](data-model.md) for complete entity definitions, relationships, and Prisma schema.

**Core Entities**:
- **Transaction**: Primary table with 1,117 records
- **Account**: Derived entity (6 accounts)
- **Category**: Hierarchical classification (~15 categories)
- **RecurringTransaction**: Computed entity with confidence scoring
- **TransferPair**: Linked transfer transactions

**Key Validations**:
- Transfer balance matching
- Category consistency
- Date range constraints
- Recurring requirements
- Amount non-zero

### API Contracts

See [contracts/](contracts/) directory for OpenAPI specifications.

**Endpoints**:
1. **Transactions API** (`contracts/transactions-api.yaml`):
   - GET /api/transactions (list with filters, sort, pagination)
   - POST /api/transactions (create)
   - GET /api/transactions/{id} (get by ID)
   - PUT /api/transactions/{id} (update)
   - DELETE /api/transactions/{id} (delete)
   - GET /api/export/csv (export to CSV)

2. **Analytics API** (`contracts/analytics-api.yaml`):
   - GET /api/analytics/kpis (KPI cards)
   - GET /api/analytics/cash-flow (income vs expenses over time)
   - GET /api/analytics/categories (spending breakdown)
   - GET /api/analytics/accounts (balance trends)
   - GET /api/analytics/recurring (recurring transactions)
   - POST /api/analytics/recurring/{id}/confirm (confirm pattern)
   - POST /api/analytics/recurring/{id}/reject (reject pattern)
   - GET /api/analytics/transfers (transfer flow)

3. **Filters API** (`contracts/filters-api.yaml`):
   - GET /api/filters/accounts (accounts list)
   - GET /api/filters/categories (categories list)
   - GET /api/filters/date-ranges (predefined ranges)
   - GET /api/filters/metadata (comprehensive filter metadata)

**Response Format**:
- Success: `{ data: T }`
- Error: `{ error: string }`
- HTTP status codes: 200, 201, 400, 404, 500

### Quickstart Documentation

See [quickstart.md](quickstart.md) for developer setup guide.

**Covers**:
- Database setup and connection
- Dependency installation
- Environment configuration
- Prisma initialization
- Development server
- Testing setup
- TDD workflow
- Common commands
- Troubleshooting

---

## Post-Phase 1 Constitution Check

*Re-evaluation after design phase*

### Principle I: Component-First Architecture ✅ PASS
- **Evidence**: Project structure defines clear component hierarchy: `components/ui/` (shadcn), `components/dashboard/` (feature components), `components/dashboard/charts/`, `components/dashboard/filters/`, etc.
- **Status**: Maintained compliance

### Principle II: Type Safety ✅ PASS
- **Evidence**: Prisma schema defined, Zod schemas in API contracts, TypeScript strict mode. All API routes have explicit types.
- **Status**: Maintained compliance

### Principle III: Database-First Design ✅ PASS
- **Evidence**: Data model documented in `data-model.md`, Prisma schema to be generated from existing DB, all relationships and constraints defined.
- **Status**: Maintained compliance

### Principle IV: API Contract Clarity ✅ PASS
- **Evidence**: OpenAPI 3.0 specs created for all 3 API groups (Transactions, Analytics, Filters), explicit request/response schemas, Zod validation required.
- **Status**: Maintained compliance

### Principle V: MVP-First, Iterate Second ✅ PASS
- **Evidence**: P1 stories prioritized, no premature optimization, simple data model leveraging existing database, clear separation of concerns.
- **Status**: Maintained compliance

### Overall Status: ✅ **PASS - Ready for Implementation (Phase 2: Tasks)**

---

## Implementation Readiness Checklist

- [x] Technical Context completed (with research for NEEDS CLARIFICATION)
- [x] Constitution Check passed (pre-design)
- [x] Phase 0: Research completed (8 technical decisions documented)
- [x] Phase 1: Data model designed (5 entities, validation rules, Prisma schema)
- [x] Phase 1: API contracts created (3 OpenAPI specs, 19 endpoints)
- [x] Phase 1: Quickstart documentation created
- [x] Phase 1: Agent context updated (Copilot)
- [x] Constitution Check re-evaluated (post-design)
- [ ] Phase 2: Tasks generated (`/speckit.tasks` command - NOT done by `/speckit.plan`)

---

## Artifacts Summary

| Artifact | Path | Status | Description |
|----------|------|--------|-------------|
| Plan | `specs/001-home-finance-dashboard/plan.md` | ✅ Complete | This file |
| Research | `specs/001-home-finance-dashboard/research.md` | ✅ Complete | Technical decisions and research |
| Data Model | `specs/001-home-finance-dashboard/data-model.md` | ✅ Complete | Entity definitions, relationships, Prisma schema |
| Transactions API | `specs/001-home-finance-dashboard/contracts/transactions-api.yaml` | ✅ Complete | OpenAPI spec for CRUD operations |
| Analytics API | `specs/001-home-finance-dashboard/contracts/analytics-api.yaml` | ✅ Complete | OpenAPI spec for analytics endpoints |
| Filters API | `specs/001-home-finance-dashboard/contracts/filters-api.yaml` | ✅ Complete | OpenAPI spec for filter options |
| Quickstart | `specs/001-home-finance-dashboard/quickstart.md` | ✅ Complete | Developer setup guide |
| Agent Context | `.github/agents/copilot-instructions.md` | ✅ Updated | Copilot-specific context file |

---

## Next Command

Run `/speckit.tasks` to generate implementation tasks from this plan and spec.

**Command stops here as per instruction: "Stop and report after Phase 2 planning"**
