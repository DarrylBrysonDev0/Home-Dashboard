# Phase 0: Research & Technical Decisions
**Feature**: Home Finance Dashboard  
**Date**: 2026-01-07  
**Status**: Completed

## Research Tasks

### 1. Testing Framework Selection

**Unknown**: Best testing framework for Next.js 14 App Router with TypeScript and Prisma (Technical Context: Testing NEEDS CLARIFICATION)

#### Decision: Vitest + Testing Library + Playwright

**Rationale**:
- **Vitest**: Native ESM support, faster than Jest (~2-10x), better DX with built-in TypeScript support, Vite-compatible (future-proof for Next.js trends)
- **React Testing Library**: Component testing standard, works seamlessly with Vitest
- **Playwright**: E2E testing with built-in test runner, excellent Next.js integration, cross-browser support, automatic waiting/retries
- **Prisma Test Containers**: Use `@testcontainers/mssql` for isolated database tests with ephemeral containers

**Alternatives Considered**:
1. **Jest + React Testing Library + Cypress**
   - **Rejected**: Jest slower than Vitest, requires more configuration for ESM/TypeScript; Cypress heavier than Playwright and has more flaky tests
2. **Jest + Playwright** (current standard)
   - **Rejected**: Jest still slower; Vitest provides better Next.js 14+ experience
3. **Test-in-production (skip automated tests)**
   - **Rejected**: Violates spec requirement for TDD methodology and 80% coverage

**Implementation Details**:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test @testcontainers/mssql
```

**Configuration Files**:
- `vitest.config.ts` - Unit/integration test runner
- `playwright.config.ts` - E2E test runner
- `.github/workflows/test.yml` - CI pipeline (optional for home lab)

---

### 2. Test Database Container Strategy

**Unknown**: How to handle database state for integration and E2E tests without polluting development database

#### Decision: Testcontainers with Ephemeral MSSQL Instances

**Rationale**:
- **Isolation**: Each test suite gets fresh database, no state leakage
- **Parallelization**: Tests run concurrently without conflicts
- **CI/CD Ready**: Works in GitHub Actions or local Docker environment
- **Cleanup**: Containers automatically destroyed after tests
- **Fast**: Containers start in ~5-10 seconds with SQL Server

**Alternatives Considered**:
1. **Transaction Rollback per Test**
   - **Rejected**: Complex with Next.js Server Components, requires manual setup/teardown, doesn't test migrations
2. **Shared Test Database with Reset Script**
   - **Rejected**: Slower (full truncate + reseed), non-parallel, risk of state contamination
3. **SQLite in-memory for Tests**
   - **Rejected**: Different SQL dialect from MSSQL, doesn't catch real database issues (e.g., MSSQL-specific syntax, performance)

**Implementation Details**:
```typescript
// __tests__/helpers/test-db.ts
import { GenericContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';

export async function setupTestDatabase() {
  const container = await new GenericContainer('mcr.microsoft.com/mssql/server:2025-latest')
    .withEnvironment({ ACCEPT_EULA: 'Y', SA_PASSWORD: 'TestPass123!' })
    .withExposedPorts(1433)
    .start();
  
  const port = container.getMappedPort(1433);
  const databaseUrl = `sqlserver://localhost:${port};database=test;user=sa;password=TestPass123!;trustServerCertificate=true`;
  
  const prisma = new PrismaClient({ datasource: { url: databaseUrl } });
  await prisma.$executeRaw`CREATE DATABASE test`;
  // Run Prisma migrations
  
  return { prisma, container };
}
```

---

### 3. Prisma Schema Design Best Practices

**Unknown**: How to structure Prisma schema for existing MSSQL database with optimal indexes and relationships

#### Decision: Introspect Existing DB, Add Indexes, Use Prisma Relations

**Rationale**:
- **Start with Introspection**: `prisma db pull` generates schema from existing `HomeFinance-db` database
- **Add Indexes**: Prisma doesn't auto-detect all indexes; manually add composite indexes for common queries (date + account, category + date)
- **Use Relations**: Define implicit relations between transactions and calculated aggregates (even though DB has single table)
- **No ORM Overhead for Analytics**: Use `$queryRaw` for complex aggregations (cash flow, category totals) instead of nested Prisma queries

**Alternatives Considered**:
1. **Write Schema from Scratch**
   - **Rejected**: Risk of schema mismatch with existing database, wastes time duplicating work
2. **Direct SQL Only (skip Prisma)**
   - **Rejected**: Loses type safety, no migration management, violates Constitution Principle III
3. **Prisma for All Queries**
   - **Rejected**: Complex aggregations (SUM/GROUP BY with multiple dimensions) are verbose in Prisma; raw SQL more readable

**Implementation Details**:
```bash
# Initial introspection
npx prisma db pull

# Add to schema after pull:
model Transaction {
  @@index([transaction_date(sort: Desc), account_id], name: "idx_date_account")
  @@index([category, transaction_date(sort: Desc)], name: "idx_category_date")
  @@index([transaction_type, transaction_date(sort: Desc)], name: "idx_type_date")
}

# Generate Prisma Client
npx prisma generate
```

**Query Strategy**:
- **Simple CRUD**: Use Prisma Client (type-safe, migrations)
- **Complex Analytics**: Use `prisma.$queryRaw<T>` with Zod validation of results

---

### 4. Recharts Configuration for Dashboard Visualizations

**Unknown**: How to configure Recharts for responsive, accessible charts with custom color palette

#### Decision: Recharts with ResponsiveContainer + Custom Palette + WCAG AA Colors

**Rationale**:
- **ResponsiveContainer**: Auto-adjusts chart size to parent container (responsive without media queries)
- **Custom Palette**: Use spec-defined 12-color accessible palette in `lib/constants/colors.ts`
- **Accessibility**: Add `aria-label` to charts, ensure 4.5:1 contrast, include both color and pattern/label
- **Tooltips**: Custom tooltips with formatted currency and dates
- **Treeshaking**: Import only needed chart components (BarChart, LineChart, PieChart, Sankey)

**Alternatives Considered**:
1. **Chart.js**
   - **Rejected**: Heavier bundle size, less React-idiomatic, requires canvas (Recharts uses SVG)
2. **Victory Charts**
   - **Rejected**: More complex API, larger bundle, less active maintenance
3. **D3.js Directly**
   - **Rejected**: Too low-level for MVP, steep learning curve, more code to maintain

**Implementation Details**:
```typescript
// lib/constants/colors.ts
export const CHART_COLORS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
  '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4', '#84CC16', '#A855F7'
];

export const SEMANTIC_COLORS = {
  income: '#10B981',   // Mint green
  expense: '#F87171',  // Coral
  neutral: '#6B7280',  // Gray
  transfer: '#3B82F6' // Blue
};

// components/dashboard/charts/cash-flow-chart.tsx
<ResponsiveContainer width="100%" height={350}>
  <BarChart data={data}>
    <Bar dataKey="income" fill={SEMANTIC_COLORS.income} />
    <Bar dataKey="expense" fill={SEMANTIC_COLORS.expense} />
    <Tooltip content={<CustomTooltip />} />
  </BarChart>
</ResponsiveContainer>
```

---

### 5. TanStack Table Configuration for Transaction Table

**Unknown**: How to implement sortable, filterable transaction table with export and search functionality

#### Decision: TanStack Table v8 with Column Filters + Global Filter + CSV Export

**Rationale**:
- **TanStack Table v8**: Headless, framework-agnostic, fully typed, supports all required features (sort, filter, pagination, export)
- **Column Filters**: Built-in column filtering for category, account, type
- **Global Filter**: Single search box filters across description and category columns
- **CSV Export**: Use `react-csv` or custom function to serialize visible rows
- **Server-side vs Client-side**: Start with client-side (10K transactions feasible), optimize to server-side if performance issues

**Alternatives Considered**:
1. **AG Grid**
   - **Rejected**: Overkill for MVP, commercial license for some features, heavier bundle
2. **Material-UI Data Grid**
   - **Rejected**: Tight coupling to Material-UI design system (using shadcn/ui)
3. **Custom HTML Table**
   - **Rejected**: Reinventing wheel for sort/filter logic, violates DRY principle

**Implementation Details**:
```typescript
// components/dashboard/transactions/transaction-table.tsx
const table = useReactTable({
  data: transactions,
  columns: transactionColumns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    sorting,
    columnFilters,
    globalFilter
  }
});

// Export function
function exportToCSV() {
  const rows = table.getFilteredRowModel().rows;
  const csv = rows.map(row => /* serialize */).join('\n');
  downloadFile(csv, 'transactions.csv');
}
```

---

### 6. Date Range Filter Implementation

**Unknown**: Best UX pattern for quick-select date filters vs custom date range picker

#### Decision: Quick-Select Buttons + Shadcn Calendar Popover for Custom Range

**Rationale**:
- **Quick Select**: Buttons for "This Month", "Last Month", "Last 3 Months", "Last 6 Months", "YTD", "Last 12 Months", "All Time" (90% of use cases)
- **Custom Range**: Shadcn `<Popover>` + `<Calendar>` component for edge cases
- **date-fns**: Use `startOfMonth()`, `subMonths()`, etc. for date calculations (lighter than moment.js, tree-shakeable)
- **URL State**: Store active filter in URL query params for shareable links (e.g., `?period=last-3-months`)

**Alternatives Considered**:
1. **Date Picker Only (no quick select)**
   - **Rejected**: Poor UX for common ranges, requires multiple clicks
2. **Dropdown with Predefined Ranges**
   - **Rejected**: Less scannable than buttons, requires extra click to open dropdown
3. **Moment.js for Date Manipulation**
   - **Rejected**: Heavy bundle size (67KB minified), deprecated in favor of native Date/date-fns

**Implementation Details**:
```typescript
// components/dashboard/filters/time-filter.tsx
const QUICK_RANGES = [
  { label: 'This Month', getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: 'Last Month', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  // ...
];

// URL state with Next.js useSearchParams
const searchParams = useSearchParams();
const period = searchParams.get('period') || 'all-time';
```

---

### 7. Recurring Transaction Detection Algorithm

**Unknown**: How to implement recurring transaction detection with confidence scoring (High/Medium/Low)

#### Decision: Pattern Matching + Interval Analysis + Amount Variance with Confidence Scoring

**Rationale**:
- **Pattern Matching**: Group transactions by fuzzy description match (Levenshtein distance or substring similarity)
- **Interval Analysis**: Calculate day differences between occurrences; detect weekly (7±1 days), monthly (28-31 days), biweekly (14±1 days)
- **Amount Variance**: Calculate coefficient of variation (CV = std dev / mean); CV < 0.10 = High confidence, 0.10-0.20 = Medium, 0.20-0.30 = Low
- **Minimum Occurrences**: Require 3+ transactions to classify as recurring
- **Confidence Scoring**:
  - **High (90-100%)**: Perfect interval regularity, CV < 0.05, exact description match
  - **Medium (70-89%)**: Slight interval variance, CV < 0.15, similar description
  - **Low (50-69%)**: Irregular intervals, CV < 0.30, fuzzy description match

**Alternatives Considered**:
1. **Machine Learning Model (e.g., clustering)**
   - **Rejected**: Overkill for MVP, requires training data, adds complexity
2. **Manual Flagging Only**
   - **Rejected**: Poor UX, violates spec requirement for automatic detection (FR-009)
3. **Exact Description Match Only**
   - **Rejected**: Misses subscriptions with dynamic parts (e.g., "Netflix - Invoice #12345" vs "Netflix - Invoice #12346")

**Implementation Details**:
```typescript
// lib/queries/recurring.ts
export async function detectRecurringTransactions(accountId: string) {
  // 1. Group by fuzzy description match
  const groups = groupByDescriptionSimilarity(transactions, 0.8); // 80% similarity
  
  // 2. For each group with 3+ transactions
  return groups.filter(g => g.length >= 3).map(group => {
    const intervals = calculateIntervals(group.map(t => t.date));
    const amounts = group.map(t => t.amount);
    
    const avgInterval = mean(intervals);
    const intervalStdDev = stdDev(intervals);
    const amountCV = stdDev(amounts) / mean(amounts);
    
    // 3. Determine frequency and confidence
    const frequency = classifyFrequency(avgInterval); // Weekly, Biweekly, Monthly
    const confidence = calculateConfidence(intervalStdDev, amountCV, group.length);
    
    return { 
      pattern: group[0].description, 
      frequency, 
      confidence,
      avgAmount: mean(amounts),
      nextExpected: addDays(last(group).date, avgInterval)
    };
  });
}
```

---

### 8. Transfer Flow Diagram Implementation

**Unknown**: How to render Sankey/flow diagram for transfer visualization between accounts

#### Decision: Recharts Sankey Chart with Preprocessed Transfer Pairs

**Rationale**:
- **Recharts Sankey**: Built-in Sankey chart component, works with existing Recharts setup, SVG-based (accessible)
- **Transfer Pair Detection**: Identify matching transfer pairs (same amount, same date, opposite transaction types) between accounts
- **Node Width**: Proportional to total transfer amount
- **Color Coding**: Use semantic transfer color (#3B82F6) for all flows
- **Tooltip**: Show source, destination, total amount on hover

**Alternatives Considered**:
1. **D3 Sankey Plugin**
   - **Rejected**: Requires D3.js (large bundle), more complex setup, inconsistent with Recharts usage
2. **React Flow**
   - **Rejected**: Designed for node-based workflows, not optimal for financial flow diagrams
3. **Simple Bar Chart of Transfers**
   - **Rejected**: Less visual impact, doesn't show flow directionality

**Implementation Details**:
```typescript
// lib/queries/transfers.ts
export async function getTransferFlows(startDate: Date, endDate: Date) {
  const transfers = await prisma.transaction.findMany({
    where: { 
      transaction_type: 'Transfer',
      transaction_date: { gte: startDate, lte: endDate }
    }
  });
  
  // Group by account pairs
  const flows = transfers.reduce((acc, t) => {
    const key = `${t.account_id}->${t.destination_account}`;
    acc[key] = (acc[key] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  
  // Convert to Sankey format
  return Object.entries(flows).map(([key, value]) => {
    const [source, target] = key.split('->');
    return { source, target, value };
  });
}

// components/dashboard/charts/transfer-flow.tsx
<Sankey 
  data={transferData} 
  node={{ fill: SEMANTIC_COLORS.transfer }}
  link={{ stroke: SEMANTIC_COLORS.transfer, opacity: 0.3 }}
/>
```

---

## Summary of Technical Decisions

| Unknown | Decision | Key Rationale |
|---------|----------|---------------|
| Testing Framework | Vitest + Playwright + Testcontainers | Faster than Jest, better ESM support, isolated test DBs |
| Test Database Strategy | Ephemeral MSSQL containers | Isolation, parallelization, no state leakage |
| Prisma Schema Design | Introspect + Manual Indexes + Raw SQL for Analytics | Type safety + performance for complex queries |
| Chart Library | Recharts with Custom Palette | Responsive, accessible, lighter than alternatives |
| Transaction Table | TanStack Table v8 | Headless, typed, supports all required features |
| Date Filter UX | Quick-select buttons + Custom range popover | Covers 90% use cases with buttons, fallback to custom |
| Recurring Detection | Pattern matching + Interval + Amount variance | Rule-based algorithm with confidence scoring |
| Transfer Visualization | Recharts Sankey | Consistent with chart stack, shows flow directionality |

---

## Next Steps

All NEEDS CLARIFICATION items resolved. Proceed to **Phase 1: Data Model & Contracts**.
