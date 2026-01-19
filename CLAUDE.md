# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Run production build

# Testing
npm test                 # Run unit/integration tests (Vitest)
npm run test:ui          # Vitest with browser UI
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Playwright with UI

# Run single test file
npx vitest run __tests__/unit/components/kpi-card.test.tsx

# Database
docker compose up -d     # Start MSSQL database
docker compose down      # Stop database
npx prisma studio        # Visual database browser
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Development Workflow (TDD)

All features MUST use Test-Driven Development:
1. **RED**: Write failing test for acceptance scenario
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping tests green
4. **COMMIT**: Use conventional format (`feat:`, `fix:`, `test:`, `refactor:`)

## Architecture

### Next.js App Router Pattern

This is a Next.js 14+ project using the App Router with a clear server/client component split:

- **Server Components** (default): Used for layouts, metadata, and data fetching
- **Client Components** (`"use client"`): Used for interactivity, hooks, and browser APIs

The dashboard uses a **shell pattern** where the server layout provides metadata while a client component (`DashboardShell`) wraps content with React Context.

### Data Flow Architecture

```
FilterContext (global state)
      ↓
FilteredKPICards / FilteredCashFlowChart (context consumers)
      ↓
KPICards / CashFlowChart (prop-based, testable)
      ↓
API Routes (/api/analytics/*)
      ↓
Query functions (lib/queries/*)
      ↓
Prisma → MSSQL
```

**Key pattern**: Dashboard components have two versions:
1. **Prop-based** (`KPICards`, `CashFlowChart`) - directly testable, accepts filter props
2. **Context-aware** (`FilteredKPICards`, `FilteredCashFlowChart`) - wrappers that consume FilterContext

### Directory Conventions

- `app/api/` - API routes with Zod validation, return `{ data: T }` or `{ error: string }`
- `lib/queries/` - Prisma database queries (reusable across API routes)
- `lib/validations/` - Zod schemas for API input/output types
- `lib/contexts/` - React Context providers
- `lib/constants/` - Static configuration (colors, date ranges)
- `lib/theme/` - Theme system (hooks, CSS variables, light/dark configs)
- `components/ui/` - shadcn/ui components (do not modify directly)
- `components/dashboard/` - Finance dashboard components
- `components/navigation/` - NavBar, NavItem, MobileDrawer, Logo
- `components/home/` - Landing page (HeroSection, AppCard, UpcomingEvents)
- `components/calendar/` - Calendar/events components (FullCalendar wrapper)

### API Contract Pattern

All API routes follow this structure:
```typescript
// Validate input with Zod
const result = filterSchema.safeParse(params);
if (!result.success) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}

// Return consistent response shape
return NextResponse.json({ data: result });
```

### Testing Structure

- `__tests__/unit/` - Component and function unit tests
- `__tests__/integration/api/` - API route integration tests
- `__tests__/e2e/` - Playwright browser tests
- `__tests__/helpers/` - Test utilities (test database with Testcontainers)

### Authentication (NON-NEGOTIABLE)

All routes require authentication via NextAuth.js middleware:
- **Protected by default**: All pages and API routes require auth
- **Public routes only**: `/login`, `/api/auth/*`, static assets
- **Admin routes** (`/admin/*`): Require ADMIN role check
- Server components: Use `getServerSession()` for auth checks
- Client components: Use `useSession()` hook
- Session: JWT strategy, 7-day duration

### Theme System

Light/dark mode via `next-themes` with CSS variables:
- Toggle: `ThemeToggle` component in navbar
- Chart colors: Use `useChartTheme()` hook for theme-aware colors
- CSS variables: `--bg-page`, `--text-primary`, etc. defined in `globals.css`

## Key Conventions

### TypeScript Strictness
- `strict: true` enabled - no implicit any
- All components must have explicit prop interfaces
- Zod schemas required for all API inputs

### Component Props Pattern
```typescript
export interface MyComponentProps {
  /** JSDoc for prop */
  value: string;
  /** Optional props use ? */
  className?: string;
}
```

### Filter Context Usage
Components inside the dashboard should use `FilteredX` variants that consume context:
```typescript
// In dashboard pages - uses FilterContext automatically
<FilteredKPICards />

// In tests or standalone - pass props directly
<KPICards startDate={date} endDate={date} accountIds={[]} />
```

### Database
- MSSQL Server 2025 running in Docker on port 1434
- Connection string in `.env.local` (DATABASE_URL)
- Use `lib/db.ts` singleton for Prisma client access
- Sample data: 1,117 transactions in `HomeFinance-db`

## Feature Specifications

Feature specs live in `specs/[###-feature-name]/`:
- `spec.md` - Requirements and user stories (P1, P2, P3 priorities)
- `plan.md` - Technical design and architecture
- `tasks.md` - Implementation checklist
- `contracts/` - OpenAPI specs for APIs

Speckit workflow commands:
- `/speckit.specify` - Create feature spec from description
- `/speckit.plan` - Generate technical plan
- `/speckit.tasks` - Generate implementation tasks
- `/speckit.implement` - Execute tasks from `tasks.md`

Project constitution: `.specify/memory/constitution.md` (core principles and standards)
