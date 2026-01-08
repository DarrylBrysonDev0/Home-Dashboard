# Tasks: Home Finance Dashboard

**Feature**: 001-home-finance-dashboard  
**Input**: Design documents from `/specs/001-home-finance-dashboard/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅  
**Date Generated**: 2026-01-07

**Tests**: Tests ARE included per TDD methodology mandate (spec.md). Write tests FIRST, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic Next.js 14 App Router structure

- [x] T001 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router in project root
- [x] T002 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T003 [P] Configure Tailwind CSS with custom theme colors (semantic + 12-color accessible palette) in tailwind.config.ts
- [x] T004 [P] Install shadcn/ui and initialize with default configuration
- [x] T005 [P] Create .env.local with DATABASE_URL connection string
- [x] T006 [P] Install core dependencies: prisma, @prisma/client, recharts, @tanstack/react-table, react-hook-form, zod, lucide-react, sonner, date-fns, clsx, tailwind-merge

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Prisma Setup

- [x] T007 Run `npx prisma db pull` to introspect existing HomeFinance-db schema into prisma/schema.prisma
- [x] T008 Add composite indexes to Prisma schema: idx_date_account, idx_category_date, idx_type_date, idx_recurring in prisma/schema.prisma
- [x] T009 Run `npx prisma generate` to generate Prisma Client types
- [x] T010 Create Prisma client singleton in lib/db.ts

### Shared Utilities & Constants

- [x] T011 [P] Create utility functions (cn for clsx + tailwind-merge) in lib/utils.ts
- [x] T012 [P] Create chart color constants (CHART_COLORS, SEMANTIC_COLORS) in lib/constants/colors.ts
- [x] T013 [P] Create date range constants (quick select periods) in lib/constants/date-ranges.ts

### Zod Validation Schemas

- [x] T014 [P] Create filter validation schema (date range, account filter) in lib/validations/filters.ts
- [x] T015 [P] Create transaction validation schema in lib/validations/transaction.ts
- [x] T016 [P] Create analytics validation schema in lib/validations/analytics.ts

### shadcn/ui Components

- [x] T017 [P] Install shadcn Button component: `npx shadcn-ui@latest add button`
- [x] T018 [P] Install shadcn Card component: `npx shadcn-ui@latest add card`
- [x] T019 [P] Install shadcn Select component: `npx shadcn-ui@latest add select`
- [x] T020 [P] Install shadcn Table component: `npx shadcn-ui@latest add table`
- [x] T021 [P] Install shadcn Calendar + Popover components: `npx shadcn-ui@latest add calendar popover`
- [x] T022 [P] Install shadcn Skeleton component: `npx shadcn-ui@latest add skeleton`
- [x] T023 [P] Install shadcn Tooltip component: `npx shadcn-ui@latest add tooltip`
- [x] T024 [P] Install and configure sonner for toast notifications

### Layout & Base Pages

- [x] T025 Create root layout with Tailwind styles and font configuration in app/layout.tsx
- [x] T026 [P] Create simple landing page redirecting to dashboard in app/page.tsx
- [x] T027 Create dashboard layout with filter sidebar in app/dashboard/layout.tsx
- [x] T028 Create empty state component in components/dashboard/empty-states/no-data.tsx
- [x] T029 [P] Create loading skeleton components in components/dashboard/loading-skeleton.tsx

### Testing Infrastructure

- [x] T030 [P] Install and configure Vitest with vitest.config.ts
- [x] T031 [P] Install and configure React Testing Library with test utilities in __tests__/setup.ts
- [x] T032 [P] Install and configure Playwright with playwright.config.ts
- [x] T033 [P] Create test database helper using Testcontainers in __tests__/helpers/test-db.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Financial Health Summary (Priority: P1) 🎯 MVP

**Goal**: Display top-level KPI cards (Net Cash Flow, Total Balance, MoM Change, Recurring Expenses, Largest Expense) when opening the dashboard

**Independent Test**: Verify KPI cards display correctly with sample data and show $0 with empty state when no transactions exist

### Tests for US1 (TDD: Write FIRST, must FAIL before implementation)

- [x] T034 [P] [US1] Write unit tests for KPI calculation functions (net cash flow, MoM change) in __tests__/unit/queries/analytics.test.ts
- [x] T035 [P] [US1] Write integration test for GET /api/analytics/kpis endpoint in __tests__/integration/api/kpis.test.ts
- [x] T036 [P] [US1] Write component test for KPICard with trend indicators in __tests__/unit/components/kpi-card.test.tsx

### API Layer for US1

- [x] T037 [P] [US1] Create accounts query helper (get distinct accounts with current balance) in lib/queries/accounts.ts
- [x] T038 [P] [US1] Create KPI calculation queries (net cash flow, total balance, MoM change, recurring total, largest expense) in lib/queries/analytics.ts
- [x] T039 [US1] Implement GET /api/analytics/kpis route with Zod validation and filter params in app/api/analytics/kpis/route.ts

### UI Components for US1

- [x] T040 [P] [US1] Create KPICard component with trend indicator (up/down arrow, color) in components/dashboard/kpi-card.tsx
- [x] T041 [US1] Create KPICards container fetching data from /api/analytics/kpis in components/dashboard/kpi-cards.tsx

### Dashboard Integration for US1

- [x] T042 [US1] Create main dashboard page with KPI cards section in app/dashboard/page.tsx

**Checkpoint**: User Story 1 complete - KPI cards display financial health summary

---

## Phase 4: User Story 2 - View Cash Flow Over Time (Priority: P1)

**Goal**: Display income vs expenses chart over time with transfers excluded

**Independent Test**: Verify cash flow chart shows income (green) and expenses (coral) bars with correct tooltips

### Tests for US2 (TDD: Write FIRST, must FAIL before implementation)

- [x] T043 [P] [US2] Write unit tests for cash flow aggregation (transfer exclusion) in __tests__/unit/queries/cash-flow.test.ts
- [x] T044 [P] [US2] Write integration test for GET /api/analytics/cash-flow endpoint in __tests__/integration/api/cash-flow.test.ts

### API Layer for US2

- [x] T045 [US2] Create cash flow aggregation query (income/expense by period, exclude transfers) in lib/queries/cash-flow.ts
- [x] T046 [US2] Implement GET /api/analytics/cash-flow route with granularity param in app/api/analytics/cash-flow/route.ts

### UI Components for US2

- [x] T047 [P] [US2] Create custom chart tooltip component in components/dashboard/charts/chart-tooltip.tsx
- [x] T048 [US2] Create CashFlowChart component using Recharts BarChart in components/dashboard/charts/cash-flow-chart.tsx

### Dashboard Integration for US2

- [x] T049 [US2] Add CashFlowChart to dashboard page in app/dashboard/page.tsx

**Checkpoint**: User Story 2 complete - Cash flow visualization working

---

## Phase 5: User Story 3 - Filter Transactions by Time and Account (Priority: P1)

**Goal**: Enable filtering by quick-select time periods, custom date range, and account multi-select

**Independent Test**: Verify filters update all charts and KPIs when changed

### Tests for US3 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T050 [P] [US3] Write integration tests for GET /api/filters/accounts and /api/filters/date-ranges in __tests__/integration/api/filters.test.ts
- [ ] T051 [P] [US3] Write component tests for TimeFilter and AccountFilter in __tests__/unit/components/filters.test.tsx

### API Layer for US3

- [ ] T052 [P] [US3] Implement GET /api/filters/accounts route (list all accounts) in app/api/filters/accounts/route.ts
- [ ] T053 [P] [US3] Implement GET /api/filters/date-ranges route (quick select options with computed dates) in app/api/filters/date-ranges/route.ts

### UI Components for US3

- [ ] T054 [P] [US3] Create TimeFilter component with quick-select buttons and custom date picker in components/dashboard/filters/time-filter.tsx
- [ ] T055 [P] [US3] Create AccountFilter component with multi-select dropdown in components/dashboard/filters/account-filter.tsx
- [ ] T056 [US3] Create FilterContext provider for global filter state in lib/contexts/filter-context.tsx

### Dashboard Integration for US3

- [ ] T057 [US3] Integrate FilterContext and filter components into dashboard layout in app/dashboard/layout.tsx
- [ ] T058 [US3] Update KPICards to consume filter context and refetch on filter change in components/dashboard/kpi-cards.tsx
- [ ] T059 [US3] Update CashFlowChart to consume filter context and refetch on filter change in components/dashboard/charts/cash-flow-chart.tsx

**Checkpoint**: User Story 3 complete - Filtering updates all dashboard components

---

## Phase 6: User Story 4 - View Spending by Category (Priority: P2)

**Goal**: Display spending breakdown with donut chart (percentages) and horizontal bar chart (amounts)

**Independent Test**: Verify category charts display sorted by amount descending with drill-down to transactions

### Tests for US4 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T060 [P] [US4] Write unit tests for category aggregation query in __tests__/unit/queries/categories.test.ts
- [ ] T061 [P] [US4] Write integration test for GET /api/analytics/categories endpoint in __tests__/integration/api/categories.test.ts

### API Layer for US4

- [ ] T062 [US4] Create category aggregation query (expense totals by category, percentages) in lib/queries/categories.ts
- [ ] T063 [US4] Implement GET /api/analytics/categories route with subcategory option in app/api/analytics/categories/route.ts
- [ ] T064 [P] [US4] Implement GET /api/filters/categories route (list all categories) in app/api/filters/categories/route.ts

### UI Components for US4

- [ ] T065 [P] [US4] Create CategoryDonut component using Recharts PieChart in components/dashboard/charts/category-donut.tsx
- [ ] T066 [P] [US4] Create CategoryBar component using Recharts BarChart (horizontal) in components/dashboard/charts/category-bar.tsx
- [ ] T067 [US4] Create SpendingByCategory container with drill-down modal in components/dashboard/spending-by-category.tsx

### Dashboard Integration for US4

- [ ] T068 [US4] Add SpendingByCategory to dashboard page with filter integration in app/dashboard/page.tsx

**Checkpoint**: User Story 4 complete - Category breakdown charts working

---

## Phase 7: User Story 5 - Track Account Balance Trends (Priority: P2)

**Goal**: Display multi-line chart showing balance trends for each account over time

**Independent Test**: Verify chart shows one line per account with legend toggle functionality

### Tests for US5 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T069 [P] [US5] Write unit tests for balance trend query in __tests__/unit/queries/balance-trends.test.ts
- [ ] T070 [P] [US5] Write integration test for GET /api/analytics/accounts endpoint in __tests__/integration/api/accounts.test.ts

### API Layer for US5

- [ ] T071 [US5] Create account balance trend query (balance over time per account) in lib/queries/balance-trends.ts
- [ ] T072 [US5] Implement GET /api/analytics/accounts route with granularity param in app/api/analytics/accounts/route.ts

### UI Components for US5

- [ ] T073 [US5] Create BalanceTrendsChart component using Recharts LineChart with toggleable legend in components/dashboard/charts/balance-trends.tsx

### Dashboard Integration for US5

- [ ] T074 [US5] Add BalanceTrendsChart to dashboard page with filter integration in app/dashboard/page.tsx

**Checkpoint**: User Story 5 complete - Account balance trends working

---

## Phase 8: User Story 6 - View and Manage Transaction Details (Priority: P2)

**Goal**: Display sortable, searchable transaction table with CSV export

**Independent Test**: Verify table displays all columns, supports sort/filter/search, and exports correctly

### Tests for US6 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T075 [P] [US6] Write unit tests for transaction list query in __tests__/unit/queries/transactions.test.ts
- [ ] T076 [P] [US6] Write integration test for GET /api/transactions and GET /api/export/csv endpoints in __tests__/integration/api/transactions.test.ts

### API Layer for US6

- [ ] T077 [US6] Create transaction list query with sort, filter, pagination in lib/queries/transactions.ts
- [ ] T078 [US6] Implement GET /api/transactions route with all filter/sort/pagination params in app/api/transactions/route.ts
- [ ] T079 [P] [US6] Implement GET /api/export/csv route for transaction export in app/api/export/csv/route.ts

### UI Components for US6

- [ ] T080 [US6] Create TransactionTable component using TanStack Table with column definitions in components/dashboard/transactions/transaction-table.tsx
- [ ] T081 [US6] Add search input and export button to TransactionTable in components/dashboard/transactions/transaction-table.tsx
- [ ] T082 [P] [US6] Create CSV export utility function in lib/utils/csv-export.ts

### Dashboard Integration for US6

- [ ] T083 [US6] Add TransactionTable section to dashboard page with filter integration in app/dashboard/page.tsx

**Checkpoint**: User Story 6 complete - Transaction table with export working

---

## Phase 9: User Story 7 - Identify Recurring Transactions (Priority: P3)

**Goal**: Automatically detect and display recurring transactions with confidence scores

**Independent Test**: Verify recurring detection algorithm identifies patterns and displays in dedicated table

### Tests for US7 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T084 [P] [US7] Write unit tests for recurring detection algorithm (pattern matching, confidence scoring) in __tests__/unit/queries/recurring.test.ts
- [ ] T085 [P] [US7] Write integration tests for GET /api/analytics/recurring and confirm/reject endpoints in __tests__/integration/api/recurring.test.ts

### API Layer for US7

- [ ] T086 [US7] Create recurring transaction detection algorithm (pattern matching, confidence scoring) in lib/queries/recurring.ts
- [ ] T087 [US7] Implement GET /api/analytics/recurring route in app/api/analytics/recurring/route.ts
- [ ] T088 [P] [US7] Implement POST /api/analytics/recurring/[pattern_id]/confirm route in app/api/analytics/recurring/[pattern_id]/confirm/route.ts
- [ ] T089 [P] [US7] Implement POST /api/analytics/recurring/[pattern_id]/reject route in app/api/analytics/recurring/[pattern_id]/reject/route.ts

### UI Components for US7

- [ ] T090 [US7] Create RecurringTable component with confirm/reject actions in components/dashboard/transactions/recurring-table.tsx
- [ ] T091 [US7] Add confidence badge component (High/Medium/Low with colors) in components/dashboard/confidence-badge.tsx

### Dashboard Integration for US7

- [ ] T092 [US7] Add RecurringTransactions section to dashboard page in app/dashboard/page.tsx

**Checkpoint**: User Story 7 complete - Recurring transaction detection working

---

## Phase 10: User Story 8 - View Transfer Flow Between Accounts (Priority: P3)

**Goal**: Display Sankey/flow diagram showing money movement between accounts

**Independent Test**: Verify diagram shows connections between accounts with proportional widths and tooltips

### Tests for US8 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T093 [P] [US8] Write unit tests for transfer flow aggregation query in __tests__/unit/queries/transfers.test.ts
- [ ] T094 [P] [US8] Write integration test for GET /api/analytics/transfers endpoint in __tests__/integration/api/transfers.test.ts

### API Layer for US8

- [ ] T095 [US8] Create transfer flow aggregation query (transfers between account pairs) in lib/queries/transfers.ts
- [ ] T096 [US8] Implement GET /api/analytics/transfers route in app/api/analytics/transfers/route.ts

### UI Components for US8

- [ ] T097 [US8] Create TransferFlowChart component using Recharts Sankey in components/dashboard/charts/transfer-flow.tsx

### Dashboard Integration for US8

- [ ] T098 [US8] Add TransferFlowChart to dashboard page with filter integration in app/dashboard/page.tsx

**Checkpoint**: User Story 8 complete - Transfer flow visualization working

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T099 [P] Add comprehensive error handling to all API routes with consistent error responses
- [ ] T100 [P] Add loading skeleton states to all chart and table components
- [ ] T101 [P] Verify WCAG AA color contrast compliance across all components
- [ ] T102 [P] Add aria-labels and accessibility attributes to all interactive elements
- [ ] T103 [P] Optimize API queries for performance (verify <1s filter refresh, <3s initial load)
- [ ] T104 [P] Add responsive adjustments for tablet viewport (768px-1023px)
- [ ] T105 Run quickstart.md validation - verify complete setup flow works
- [ ] T106 Final code cleanup and documentation updates

### E2E Tests (TDD: After all stories complete)

- [ ] T107 [P] Write E2E test for User Story 1 (Financial Health Summary) in __tests__/e2e/user-story-1.spec.ts
- [ ] T108 [P] Write E2E test for User Story 2 (Cash Flow Over Time) in __tests__/e2e/user-story-2.spec.ts
- [ ] T109 [P] Write E2E test for User Story 3 (Filters) in __tests__/e2e/user-story-3.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if team capacity allows
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Start After |
|-------|----------|--------------|-----------------|
| US1 - Financial Health Summary | P1 | None | Phase 2 |
| US2 - Cash Flow Over Time | P1 | None | Phase 2 |
| US3 - Filters | P1 | US1, US2 (to integrate filters) | Phase 2, but integration after US1+US2 |
| US4 - Spending by Category | P2 | US3 (filter context) | US3 complete |
| US5 - Account Balance Trends | P2 | US3 (filter context) | US3 complete |
| US6 - Transaction Details | P2 | US3 (filter context) | US3 complete |
| US7 - Recurring Transactions | P3 | US6 (transaction queries) | US6 complete |
| US8 - Transfer Flow | P3 | US3 (filter context) | US3 complete |

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- **Setup**: T002-T006 can all run in parallel
- **Foundational**: T011-T024 can all run in parallel after T007-T010
- **Each US**: Tasks marked [P] within that US can run in parallel

---

## Parallel Execution Examples

### Setup Phase Parallel Tasks

```bash
# After T001 completes, launch in parallel:
T002: Configure TypeScript strict mode
T003: Configure Tailwind CSS theme
T004: Initialize shadcn/ui
T005: Create .env.local
T006: Install core dependencies
```

### Foundational Phase Parallel Tasks

```bash
# After T010 (Prisma client) completes, launch in parallel:
T011: lib/utils.ts
T012: lib/constants/colors.ts
T013: lib/constants/date-ranges.ts
T014: lib/validations/filters.ts
T015: lib/validations/transaction.ts
T016: lib/validations/analytics.ts
T017-T024: All shadcn/ui component installations
```

### User Story 4-6 Parallel (After US3)

```bash
# After US3 completes (filter context ready), launch in parallel:
Developer A: US4 (Spending by Category) - T049-T055
Developer B: US5 (Balance Trends) - T056-T059
Developer C: US6 (Transaction Details) - T060-T066
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (KPI Cards)
4. **STOP and VALIDATE**: Dashboard shows financial health summary
5. Deploy/demo if ready - immediate value delivered

### Incremental Delivery by Priority

| Increment | User Stories | Value Delivered |
|-----------|--------------|-----------------|
| MVP | US1 | Financial health at a glance (KPIs) |
| MVP+ | US1 + US2 | Cash flow visualization added |
| Core | US1-3 | Full filtering capability |
| Complete P1 | US1-3 | All P1 stories - core dashboard |
| Extended | US1-6 | Categories, trends, transaction table |
| Full | US1-8 | Recurring detection, transfer flow |

### Recommended Execution Order

1. **Week 1**: Setup + Foundational + US1 (MVP deliverable)
2. **Week 2**: US2 + US3 (Core filtering + charts)
3. **Week 3**: US4 + US5 + US6 (in parallel if possible)
4. **Week 4**: US7 + US8 + Polish

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 109 |
| **Setup Tasks** | 6 |
| **Foundational Tasks** | 27 (includes testing infrastructure) |
| **User Story Tasks** | 65 (includes TDD test tasks) |
| **Polish Tasks** | 11 (includes E2E tests) |
| **Parallelizable Tasks** | 68 |
| **Test Tasks** | 24 (unit, integration, E2E) |

### Tasks Per User Story

| User Story | Priority | Task Count | Test Tasks |
|------------|----------|------------|------------|
| US1 - Financial Health Summary | P1 | 9 | 3 |
| US2 - Cash Flow Over Time | P1 | 7 | 2 |
| US3 - Filters | P1 | 10 | 2 |
| US4 - Spending by Category | P2 | 9 | 2 |
| US5 - Balance Trends | P2 | 6 | 2 |
| US6 - Transaction Details | P2 | 9 | 2 |
| US7 - Recurring Transactions | P3 | 9 | 2 |
| US8 - Transfer Flow | P3 | 6 | 2 |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- **TDD Workflow**: Test tasks MUST be completed FIRST and FAIL before implementation tasks
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database already exists with 1,117 transactions - no seeding required
- Test database uses Testcontainers for isolation (see T033)
