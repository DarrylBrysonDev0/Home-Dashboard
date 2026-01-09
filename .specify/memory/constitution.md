<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.1 → 1.0.2 (Database setup documentation)
Modified Principles: Updated Core Stack to MSSQL Server 2025
Added Sections: "Development Environment" with database setup and re-initialization procedures
Removed Sections: N/A
Templates Status:
  ✅ .specify/templates/plan-template.md - No updates required
  ✅ .specify/templates/spec-template.md - No updates required
  ✅ .specify/templates/tasks-template.md - No updates required
Follow-up TODOs: None
Bump Rationale: PATCH - Added development database setup documentation and updated MSSQL version without changing core principles or architectural requirements.
-->

# Home Dashboard Constitution

## Core Principles

### I. Component-First Architecture

All features MUST be built as reusable React components with clear boundaries.

**Rules**:
- Every feature starts as a standalone component in `components/` directory
- Components MUST be self-contained with their own types, hooks, and utilities
- Server Components vs Client Components distinction MUST be explicit (`'use client'` directive when needed)
- Shared UI components from shadcn/ui MUST be placed in `components/ui/`
- Custom components MUST have clear props interfaces defined with TypeScript

**Rationale**: Component-first design ensures modularity, testability, and reusability across the dashboard. Clear separation between server and client components optimizes performance in Next.js 14+ App Router.

### II. Type Safety (NON-NEGOTIABLE)

TypeScript MUST be used throughout; `any` type is forbidden except in explicitly justified edge cases.

**Rules**:
- All functions, components, and API routes MUST have explicit type definitions
- Zod schemas MUST be defined for all forms, API inputs, and database queries
- Prisma types MUST be used for database entities
- No implicit `any` - enable `strict: true` in tsconfig.json
- Runtime validation MUST use Zod for all external inputs

**Rationale**: Type safety prevents runtime errors, improves developer experience with IntelliSense, and serves as living documentation. Zod bridges compile-time and runtime type safety.

### III. Database-First Design

Schema and data model MUST be designed and approved before implementation begins.

**Rules**:
- Prisma schema MUST be the single source of truth for data models
- All database changes MUST go through Prisma migrations (use `prisma migrate dev`)
- Direct SQL MUST be avoided unless performance requires it (document justification)
- Relationships and constraints MUST be defined in schema (foreign keys, indexes, unique constraints)
- Schema changes MUST be backward-compatible or include migration strategy

**Rationale**: Database-first design prevents data integrity issues and ensures the data model supports all features. Prisma provides type-safe database access and automatic migration management.

### IV. API Contract Clarity

All API routes MUST have explicit input validation, error handling, and response types.

**Rules**:
- API routes in `app/api/` MUST validate inputs with Zod schemas
- Response shapes MUST be consistent: `{ data: T } | { error: string }`
- HTTP status codes MUST follow REST conventions (200, 201, 400, 401, 404, 500)
- Error messages MUST be user-friendly and not expose internal details
- API documentation MUST be maintained in `contracts/` directory for each feature

**Rationale**: Clear contracts prevent miscommunication between frontend and backend, simplify debugging, and enable parallel development of UI and API.

### V. MVP-First, Iterate Second

Start with the simplest working solution; complexity MUST be justified.

**Rules**:
- Features MUST be broken into prioritized user stories (P1, P2, P3)
- P1 stories MUST deliver standalone value and be shippable
- Premature optimization is forbidden - measure before optimizing
- "YAGNI" (You Aren't Gonna Need It) principle MUST guide design decisions
- Technical debt is acceptable if documented and tracked in tasks

**Rationale**: MVP-first approach delivers value faster, enables user feedback earlier, and prevents over-engineering. For a home lab dashboard, simplicity and maintainability trump theoretical scalability.

## Technology Stack

### Core Stack (Mandatory)
- **Next.js 14+** with App Router - Framework
- **TypeScript 5.3+** - Language (strict mode enabled)
- **Prisma 5.7+** - ORM for database access
- **MSSQL Server 2025** - Database (Docker container)

### UI & Styling (Mandatory)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icon system
- **clsx + tailwind-merge** - Dynamic class composition

### Data & Forms (Mandatory)
- **Zod** - Schema validation
- **React Hook Form** - Form state management
- **Recharts** - Chart visualization
- **TanStack Table** - Data tables with sorting/filtering
- **sonner** - Toast notifications

### Optional (As Needed)
- **TanStack Query** - Server state management (for complex data fetching)
- **NextAuth.js** - Authentication (if multi-user access required)
- **date-fns** - Date manipulation

### Infrastructure (Mandatory)
- **Docker & Docker Compose** - Containerization
- **Linux (bash)** - Development and deployment environment
- **Git** - Version control

**Justification**: This stack balances modern best practices with simplicity for a home lab environment. All tools are well-documented, actively maintained, and integrate seamlessly.

## Development Workflow

### Feature Development Process

1. **Specification Phase** (`/speckit.spec` command)
   - Define user stories with priorities (P1, P2, P3)
   - Each story MUST be independently testable
   - Acceptance criteria MUST be clear and measurable

2. **Planning Phase** (`/speckit.plan` command)
   - Constitution Check MUST pass before research begins
   - Technical context MUST clarify Language/Version, Dependencies, Storage, Testing
   - Data model MUST be designed (Prisma schema draft)
   - API contracts MUST be defined
   - Quickstart documentation MUST be created

3. **Task Generation** (`/speckit.tasks` command)
   - Tasks MUST be organized by user story
   - Each story MUST be implementable and testable independently
   - File paths MUST be explicit in task descriptions
   - Parallel tasks MUST be marked with `[P]`

4. **Implementation**
   - Start with P1 user story only
   - Database schema → API routes → UI components → Integration
   - Test as you build (manual testing acceptable for MVP)
   - Use `prisma studio` for database inspection during development

5. **Validation**
   - Feature MUST satisfy acceptance criteria from spec
   - Type errors MUST be resolved (`npm run lint`)
   - Docker build MUST succeed (`docker-compose up`)
   - Manual testing MUST cover all acceptance scenarios

### Directory Structure Standards

```
Home-Dashboard/
├── app/
│   ├── api/              # API routes (validate with Zod)
│   ├── dashboard/        # Dashboard pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # shadcn components
│   ├── charts/           # Chart components
│   ├── tables/           # Table components
│   └── [feature]/        # Feature-specific components
├── lib/
│   ├── db.ts             # Prisma client singleton
│   ├── utils.ts          # Shared utilities
│   └── validations/      # Zod schemas
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── .specify/
│   ├── memory/           # Constitution and guidance
│   └── templates/        # Spec templates
├── specs/                # Feature specifications
│   └── [###-feature]/    # Per-feature docs
├── research/             # Technical research
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # Next.js container
└── package.json          # Dependencies
```

### Code Quality Standards

- **Linting**: ESLint with Next.js config MUST pass
- **Formatting**: Prettier (optional but recommended)
- **Type Checking**: `tsc --noEmit` MUST pass with zero errors
- **Build**: `npm run build` MUST succeed
- **Commits**: Use conventional commit format (feat:, fix:, docs:, refactor:)

### Testing Standards (Pragmatic)

Given this is a home lab MVP:
- Automated testing is OPTIONAL for P1 features
- Manual acceptance testing MUST cover all user scenarios
- If bugs are found, document them in tasks and fix before adding new features
- As the project matures, add tests for critical paths

### Sample Data & Agent Boundaries

**Sample Data Location**: `research/homefinance_transactions.csv`
- This file contains sample transaction data for development and testing
- It MUST NOT be loaded or read directly by AI agents during specification, planning, or task generation
- Agents MUST design schemas and APIs without assuming knowledge of the sample data structure
- Developers MUST reference this file manually during implementation and testing phases
- API implementations MAY include seed scripts that reference this file for local development

**Rationale**: Keeping agents unaware of sample data structure ensures that database schemas and API contracts are designed based on requirements rather than reverse-engineered from example data. This promotes proper data modeling and prevents schema decisions from being influenced by potentially incomplete or non-representative sample data.

## Development Environment

### Database Setup

The development database runs in Docker with persistent storage:

**Container Details**:
- **Database Name**: HomeFinance-db
- **Container**: cemdash-db
- **Image**: mcr.microsoft.com/mssql/server:2025-latest
- **Port**: 1434 (host) → 1433 (container)
- **Credentials**: sa / YourStrong@Password123
- **Persistent Volume**: mssql-data

**Connection String**:
```
DATABASE_URL="sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true"
```

**Quick Commands**:
```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker logs cemdash-db

# Connect via sqlcmd
docker exec -it cemdash-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Password123' -d HomeFinance-db -C
```

### Database Re-initialization

If the database needs to be reset or re-initialized:

1. **Stop and remove containers** (preserves volume):
   ```bash
   docker compose down
   ```

2. **Remove persistent volume** (CAUTION: deletes all data):
   ```bash
   docker volume rm home-dashboard_mssql-data
   ```

3. **Start fresh container**:
   ```bash
   docker compose up -d
   sleep 15  # Wait for MSSQL to initialize
   ```

4. **Initialize database schema**:
   ```bash
   docker exec -i cemdash-db /opt/mssql-tools18/bin/sqlcmd \
     -S localhost -U sa -P 'YourStrong@Password123' -C \
     -i /docker-entrypoint-initdb.d/01-init-db.sql
   ```

5. **Import sample data** (optional):
   ```bash
   python3 import-csv.py
   ```

**Files**:
- `docker-compose.yml` - Container orchestration
- `db-init/01-init-db.sql` - Database initialization script
- `import-csv.py` - CSV import utility
- `requirements.txt` - Python dependencies (pyodbc)

**Database Schema**:
- Main table: `transactions` (with indexes on date, account, category, type)
- View: `vw_expense_summary` (aggregated analytics)

See [DATABASE_SETUP.md](../../DATABASE_SETUP.md) for complete documentation.

## Governance

### Amendment Process

1. Propose change with rationale in constitution file (as HTML comment)
2. Identify affected templates and document required updates
3. Update constitution with new version number following semantic versioning
4. Update affected templates in `.specify/templates/`
5. Add migration notes to Sync Impact Report

### Version Numbering

- **MAJOR** (X.0.0): Backward-incompatible principle changes or removals
- **MINOR** (x.Y.0): New principles added or substantial expansions
- **PATCH** (x.y.Z): Clarifications, wording fixes, non-semantic refinements

### Compliance & Authority

- Constitution supersedes ad-hoc decisions and individual preferences
- Constitution Check in plan-template.md MUST reference principles defined here
- Complexity MUST be justified against MVP-First principle
- When in doubt, re-read principles I-V and choose the simpler path

### Review Cadence

- Review constitution after every 3 completed features
- Update if patterns emerge that aren't captured
- Remove principles that prove impractical (via MAJOR version bump)

**Version**: 1.0.2 | **Ratified**: 2026-01-07 | **Last Amended**: 2026-01-07
