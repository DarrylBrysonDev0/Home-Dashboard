# Architecture Guide: Home-Dashboard

**Version**: 1.1.0
**Last Updated**: 2026-01-20
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Data Model](#4-data-model)
5. [API Layer](#5-api-layer)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Testing Strategy](#7-testing-strategy)
8. [Infrastructure](#8-infrastructure)
9. [Development Workflow](#9-development-workflow)

---

## 1. Overview

### System Purpose

Home-Dashboard is a self-hosted personal finance and household management application providing:

- **Financial Dashboard**: Real-time monitoring of cash flow, spending patterns, account balances, and recurring transactions
- **Shared Calendar**: Household event scheduling with category filtering and email invitations
- **Theme System**: Light/Dark mode with accessibility compliance

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.3+ (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x |
| **Charts** | Recharts | 3.6 |
| **Calendar** | FullCalendar | 6.x |
| **Markdown** | react-markdown + remark-gfm | 10.1.0 / 4.0.1 |
| **Syntax Highlighting** | Shiki | 3.21.0 |
| **Diagrams** | Mermaid | 11.12.2 |
| **State** | React Context | - |
| **Forms** | React Hook Form + Zod | - |
| **Auth** | NextAuth.js | 4.24.x |
| **ORM** | Prisma | 5.7+ |
| **Database** | MSSQL Server | 2025 |
| **Testing** | Vitest + Playwright | - |
| **Runtime** | Node.js | 18+ |

### Feature Summary

| Feature | User Stories | Components | API Endpoints |
|---------|--------------|------------|---------------|
| Navigation & Landing | 6 | 10 | 1 |
| Finance Dashboard | 8 | 20+ | 14 |
| Shared Calendar | 5 | 12 | 10 |
| Markdown Reader | 9 | 18 | 6 |
| Theme System | 1 | 2 | 0 |

---

## 2. System Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│   │  Dashboard  │   │   Calendar  │   │    Admin    │              │
│   │    Page     │   │    Page     │   │    Pages    │              │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │
│          │                 │                 │                      │
│          └────────────────┼─────────────────┘                      │
│                           │                                         │
│                    ┌──────┴──────┐                                  │
│                    │   Contexts  │                                  │
│                    │  (Filter,   │                                  │
│                    │   Theme)    │                                  │
│                    └──────┬──────┘                                  │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ HTTP/Fetch
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Next.js)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      API Routes (/api)                       │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│   │  │Analytics │  │  Events  │  │  Users   │  │   Auth   │    │   │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │   │
│   └───────┼─────────────┼─────────────┼─────────────┼───────────┘   │
│           │             │             │             │               │
│           └─────────────┴─────────────┴─────────────┘               │
│                                   │                                  │
│                    ┌──────────────┴──────────────┐                  │
│                    │    Query Functions (lib/)   │                  │
│                    └──────────────┬──────────────┘                  │
│                                   │                                  │
│                    ┌──────────────┴──────────────┐                  │
│                    │      Prisma ORM Client      │                  │
│                    └──────────────┬──────────────┘                  │
│                                   │                                  │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │ TCP/1434
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE (MSSQL Server 2025)                     │
├─────────────────────────────────────────────────────────────────────┤
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│   │  transactions │  │    events     │  │     users     │          │
│   └───────────────┘  └───────────────┘  └───────────────┘          │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│   │event_categories│  │event_attendees│  │ event_invites │          │
│   └───────────────┘  └───────────────┘  └───────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Data Flow Pattern                               │
└──────────────────────────────────────────────────────────────────────────┘

    FilterContext (global state)
          │
          ▼
    ┌─────────────────────────────────────┐
    │  Context-Aware Components           │
    │  (FilteredKPICards, FilteredChart)  │
    └─────────────┬───────────────────────┘
                  │ reads filters via useFilters()
                  ▼
    ┌─────────────────────────────────────┐
    │  Prop-Based Components              │
    │  (KPICards, CashFlowChart)          │
    └─────────────┬───────────────────────┘
                  │ fetch with filter params
                  ▼
    ┌─────────────────────────────────────┐
    │  API Routes (/api/analytics/*)      │
    │  - Zod validation                   │
    │  - Error handling                   │
    └─────────────┬───────────────────────┘
                  │ calls
                  ▼
    ┌─────────────────────────────────────┐
    │  Query Functions (lib/queries/)     │
    │  - Reusable across routes           │
    │  - Type-safe return values          │
    └─────────────┬───────────────────────┘
                  │ executes
                  ▼
    ┌─────────────────────────────────────┐
    │  Prisma Client                      │
    │  → MSSQL Database                   │
    └─────────────────────────────────────┘
```

### Component Hierarchy

```
RootLayout
├── ThemeProvider (next-themes)
├── SessionProvider (NextAuth)
└── App Content
    │
    ├── NavBar (persistent navigation - all authenticated pages)
    │   ├── Logo (links to /)
    │   ├── NavItems (Home, Finance, Calendar, Settings)
    │   │   └── NavItem (individual nav link with active state)
    │   ├── ThemeToggle (with Tooltip wrapper)
    │   ├── UserMenu (avatar dropdown)
    │   └── MobileDrawer (hamburger menu for < 768px)
    │
    ├── / (Landing Page)
    │   ├── HeroSection (personalized greeting)
    │   │   └── UpcomingEvents (next 3 calendar events)
    │   │       └── EventCardMini (compact event display)
    │   └── AppSelectionPanel (app card grid)
    │       └── AppCard (module navigation cards)
    │
    ├── /dashboard
    │   └── DashboardShell (FilterProvider context)
    │       ├── FilterSidebar
    │       │   ├── TimeFilter
    │       │   └── AccountFilter
    │       └── DashboardContent
    │           ├── FilteredKPICards → KPICards
    │           ├── FilteredCashFlowChart → CashFlowChart
    │           ├── FilteredBalanceTrendsChart → BalanceTrendsChart
    │           ├── FilteredSpendingByCategory → SpendingByCategory
    │           ├── FilteredTransactionTable → TransactionTable
    │           ├── FilteredRecurringTable → RecurringTable
    │           └── FilteredTransferFlowChart → TransferFlowChart
    │
    ├── /calendar
    │   ├── CalendarView (FullCalendar)
    │   ├── CategoryFilter
    │   ├── EventModal (create/edit)
    │   └── EventDetailsDialog
    │
    ├── /reader
    │   └── ReaderProvider (ReaderContext)
    │       ├── NavigationPane (left sidebar)
    │       │   ├── SearchInput
    │       │   ├── FileTree → FileTreeNode (recursive)
    │       │   ├── RecentFiles
    │       │   └── Favorites
    │       ├── Breadcrumbs
    │       ├── ContentViewer
    │       │   ├── MarkdownRenderer (react-markdown + remark-gfm)
    │       │   ├── CodeBlock (Shiki syntax highlighting)
    │       │   └── MermaidRenderer (Mermaid diagrams)
    │       ├── TableOfContents (right sidebar)
    │       ├── DisplayModeToggle (themed/reading modes)
    │       └── FavoriteToggle
    │
    ├── /admin
    │   ├── AdminDashboard (stats)
    │   ├── UserList + UserForm
    │   ├── CategoryList + CategoryForm
    │   └── SMTPSettings
    │
    └── /login
        └── LoginForm
```

---

## 3. Directory Structure

### Project Root

```
Home-Dashboard/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Shared utilities and logic
├── prisma/                 # Database schema and migrations
├── __tests__/              # Test files
├── docs/                   # Documentation
├── specs/                  # Feature specifications
└── .specify/               # Project constitution
```

### App Router Structure (`app/`)

```
app/
├── layout.tsx              # Root layout (ThemeProvider, SessionProvider, NavBar)
├── providers.tsx           # Context providers wrapper
├── globals.css             # Global styles + CSS variables
├── page.tsx                # Landing page (HeroSection, AppSelectionPanel)
│
├── api/                    # API route handlers
│   ├── auth/
│   │   └── [...nextauth]/route.ts    # NextAuth credential auth
│   ├── analytics/
│   │   ├── kpis/route.ts             # GET financial KPIs
│   │   ├── cash-flow/route.ts        # GET income/expense trends
│   │   ├── categories/route.ts       # GET spending breakdown
│   │   ├── accounts/route.ts         # GET account balances
│   │   ├── transfers/route.ts        # GET transfer flow
│   │   └── recurring/
│   │       ├── route.ts              # GET recurring patterns
│   │       └── [id]/
│   │           ├── confirm/route.ts  # POST confirm pattern
│   │           └── reject/route.ts   # POST reject pattern
│   ├── events/
│   │   ├── route.ts                  # GET/POST events
│   │   └── [id]/
│   │       ├── route.ts              # GET/PUT/DELETE event
│   │       └── send-invite/route.ts  # POST send invite
│   ├── categories/
│   │   ├── route.ts                  # GET/POST categories
│   │   └── [id]/route.ts             # PUT/DELETE category
│   ├── users/
│   │   ├── route.ts                  # GET/POST users
│   │   └── [id]/route.ts             # GET/PUT/DELETE user
│   ├── filters/
│   │   ├── accounts/route.ts         # GET filter accounts
│   │   ├── categories/route.ts       # GET filter categories
│   │   └── date-ranges/route.ts      # GET date range presets
│   ├── export/
│   │   └── csv/route.ts              # GET CSV export
│   ├── reader/
│   │   ├── tree/route.ts             # GET file tree (lazy loading)
│   │   ├── file/route.ts             # GET file content
│   │   ├── search/route.ts           # GET file search results
│   │   ├── preferences/route.ts      # GET/PUT user preferences
│   │   └── image/route.ts            # GET images from docs
│   ├── email/
│   │   └── test/route.ts             # POST send test email
│   └── admin/
│       └── smtp-config/route.ts      # POST SMTP settings
│
├── dashboard/
│   ├── layout.tsx          # Dashboard layout (DashboardShell)
│   └── page.tsx            # Dashboard page
│
├── calendar/
│   ├── layout.tsx          # Calendar layout
│   └── page.tsx            # Calendar page
│
├── reader/
│   ├── layout.tsx          # Reader layout (ReaderProvider)
│   └── [[...path]]/page.tsx # Dynamic file viewer (catch-all route)
│
├── admin/
│   ├── layout.tsx          # Admin layout (role check)
│   ├── page.tsx            # Admin dashboard
│   ├── users/page.tsx      # User management
│   ├── categories/page.tsx # Category management
│   └── settings/page.tsx   # SMTP settings
│
└── login/
    └── page.tsx            # Login page
```

### Components Structure (`components/`)

```
components/
├── ui/                     # shadcn/ui components (20+)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── sheet.tsx           # Mobile drawer component
│   ├── table.tsx
│   ├── tooltip.tsx         # Theme toggle tooltip
│   └── ...
│
├── navigation/             # Navigation components
│   ├── nav-bar.tsx         # Main persistent navigation (64px height)
│   ├── nav-item.tsx        # Individual nav link (active state, loading)
│   ├── nav-items.tsx       # Nav items collection (Home, Finance, Calendar, Settings)
│   ├── mobile-drawer.tsx   # Slide-out mobile navigation (< 768px)
│   └── logo.tsx            # Application logo (links to /)
│
├── home/                   # Landing page components
│   ├── hero-section.tsx    # Welcome greeting with events slot
│   ├── upcoming-events.tsx # Events container (fetches, displays max 3)
│   ├── event-card-mini.tsx # Compact event display (title, date, location)
│   ├── app-selection-panel.tsx # App card grid container
│   └── app-card.tsx        # Individual app card (icon, title, description)
│
├── dashboard/              # Finance dashboard components
│   ├── dashboard-shell.tsx       # Main wrapper with FilterProvider
│   ├── kpi-card.tsx              # Single KPI display
│   ├── kpi-cards.tsx             # KPI cards container
│   ├── loading-skeleton.tsx      # Loading states
│   ├── confidence-badge.tsx      # Confidence indicator
│   ├── spending-by-category.tsx  # Category breakdown
│   ├── charts/
│   │   ├── cash-flow-chart.tsx   # Income vs expenses
│   │   ├── balance-trends.tsx    # Account balances over time
│   │   ├── category-donut.tsx    # Donut chart
│   │   ├── category-bar.tsx      # Bar chart
│   │   ├── transfer-flow.tsx     # Sankey diagram
│   │   └── chart-tooltip.tsx     # Shared tooltip
│   ├── filters/
│   │   ├── time-filter.tsx       # Date range selector
│   │   └── account-filter.tsx    # Account multi-select
│   ├── transactions/
│   │   ├── transaction-table.tsx # Transaction list
│   │   └── recurring-table.tsx   # Recurring patterns
│   └── empty-states/
│       └── no-data.tsx           # Empty state UI
│
├── calendar/               # Event calendar components
│   ├── calendar-view.tsx         # FullCalendar wrapper
│   ├── event-modal.tsx           # Create/edit event
│   ├── event-details.tsx         # Event info display
│   ├── event-details-dialog.tsx  # View event modal
│   ├── category-filter.tsx       # Category toggles
│   └── invite-form.tsx           # Email invite form
│
├── reader/                 # Markdown reader components
│   ├── ReaderLayout.tsx          # Main orchestrator
│   ├── NavigationPane.tsx        # Left sidebar wrapper
│   ├── FileTree.tsx              # Tree-based file browser
│   ├── FileTreeNode.tsx          # Individual tree node (recursive)
│   ├── SearchInput.tsx           # File search
│   ├── Breadcrumbs.tsx           # Path navigation
│   ├── RecentFiles.tsx           # Recently viewed files
│   ├── Favorites.tsx             # Bookmarked files
│   ├── ContentViewer.tsx         # Main content area
│   ├── MarkdownRenderer.tsx      # Markdown rendering (react-markdown)
│   ├── CodeBlock.tsx             # Syntax-highlighted code (Shiki)
│   ├── MermaidRenderer.tsx       # Mermaid diagrams
│   ├── TableOfContents.tsx       # Auto-generated TOC
│   ├── EmptyState.tsx            # Empty state UI
│   ├── DisplayModeToggle.tsx     # Themed/reading mode switch
│   └── FavoriteToggle.tsx        # Bookmark toggle
│
├── auth/                   # Authentication components
│   ├── login-form.tsx            # Login form
│   ├── user-menu.tsx             # User dropdown
│   └── protected-route.tsx       # Route protection
│
├── admin/                  # Admin management components
│   ├── user-list.tsx             # User table
│   ├── user-form.tsx             # User create/edit
│   ├── category-list.tsx         # Category table
│   └── category-form.tsx         # Category create/edit
│
└── theme/                  # Theme system components
    ├── ThemeProvider.tsx         # next-themes wrapper
    └── ThemeToggle.tsx           # Light/dark toggle button
```

### Library Structure (`lib/`)

```
lib/
├── db.ts                   # Prisma client singleton
├── auth.ts                 # NextAuth configuration
├── email.ts                # Nodemailer service
├── utils.ts                # clsx + tailwind-merge (cn function)
│
├── queries/                # Database query functions
│   ├── analytics.ts        # KPI calculations
│   ├── accounts.ts         # Account queries (derived from transactions)
│   ├── balance-trends.ts   # Balance time series
│   ├── cash-flow.ts        # Cash flow aggregation
│   ├── categories.ts       # Category queries
│   ├── transactions.ts     # Transaction CRUD
│   ├── recurring.ts        # Recurring detection
│   ├── transfers.ts        # Transfer flow
│   ├── events.ts           # Calendar events
│   ├── users.ts            # User management
│   ├── auth.ts             # Auth queries
│   └── invites.ts          # Event invitations
│
├── validations/            # Zod schemas
│   ├── filters.ts          # Date range, account filters
│   ├── analytics.ts        # KPI params
│   ├── transaction.ts      # Transaction schemas
│   ├── auth.ts             # Login/password schemas
│   ├── category.ts         # Category schemas
│   ├── event.ts            # Event schemas
│   ├── reader.ts           # Reader schemas (file, search, preferences)
│   └── index.ts            # Central exports
│
├── contexts/               # React Context providers
│   ├── filter-context.tsx  # FilterContext (date range, accounts)
│   └── reader-context.tsx  # ReaderContext (file navigation, preferences)
│
├── theme/                  # Theme system
│   ├── index.ts            # Public exports
│   ├── types.ts            # TypeScript interfaces
│   ├── themes/
│   │   ├── light.ts        # Light theme config
│   │   ├── dark.ts         # Dark theme config
│   │   └── index.ts        # Theme registry
│   ├── hooks/
│   │   ├── useTheme.ts     # Theme control hook
│   │   └── useChartTheme.ts # Chart colors hook
│   └── utils/
│       └── css-variables.ts # CSS variable utilities
│
├── constants/              # Static configuration
│   ├── colors.ts           # Chart color palettes
│   └── date-ranges.ts      # Quick date range presets
│
├── hooks/                  # Custom React hooks
│   ├── use-session.ts      # Session access hook
│   └── use-media-query.ts  # Responsive breakpoint detection
│
├── middleware/             # Request middleware
│   └── admin-check.ts      # Admin role verification
│
├── reader/                 # Reader service layer
│   ├── file-system.service.ts    # Sandboxed file access with security
│   ├── preferences.service.ts    # User preferences management
│   ├── heading-extractor.ts      # TOC generation from markdown
│   ├── markdown-config.ts        # Markdown rendering configuration
│   ├── shiki-highlighter.ts      # Code syntax highlighting
│   └── mermaid-themes.ts         # Mermaid diagram theming
│
├── utils/                  # Utility functions
│   ├── csv-export.ts       # CSV generation
│   ├── password.ts         # bcrypt utilities
│   ├── timezone.ts         # Timezone conversion
│   └── ics-generator.ts    # iCalendar generation
│
└── server/                 # Server-side utilities
    └── auth-session.ts     # Server session handling
```

### Type Definitions (`types/`)

```
types/
├── next-auth.d.ts          # NextAuth session type extensions
└── reader.ts               # Reader type definitions (FileNode, ReaderState, etc.)
```

### Test Structure (`__tests__/`)

```
__tests__/
├── unit/                   # Unit tests (Vitest)
│   ├── components/
│   │   ├── navigation/     # NavBar, NavItem, Logo, MobileDrawer tests
│   │   ├── home/           # HeroSection, AppCard, UpcomingEvents tests
│   │   └── ...             # Other component tests
│   ├── queries/            # Query function tests
│   └── theme/              # Theme system tests
│
├── integration/            # Integration tests (Vitest)
│   └── api/
│       └── events-upcoming.test.ts  # Upcoming events API test
│
├── e2e/                    # End-to-end tests (Playwright)
│   ├── navigation.spec.ts  # NavBar, mobile drawer, keyboard a11y tests
│   ├── landing.spec.ts     # Landing page, app cards tests
│   └── *.spec.ts
│
└── helpers/                # Test utilities
    ├── test-db.ts          # Database setup (Testcontainers)
    ├── auth-helpers.ts     # Auth mocking
    └── calendar-helpers.ts # Calendar test utils
```

---

## 4. Data Model

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Entity Relationships                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │      User       │
                              ├─────────────────┤
                              │ id (PK)         │
                              │ email (unique)  │
                              │ name            │
                              │ passwordHash    │
                              │ role (enum)     │
                              │ avatarColor     │
                              │ failedAttempts  │
                              │ lockedUntil     │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │ 1:N (creator)          │ N:M (attendees)        │
              ▼                        ▼                        │
┌─────────────────────┐    ┌─────────────────────┐             │
│   EventCategory     │    │       Event         │             │
├─────────────────────┤    ├─────────────────────┤             │
│ id (PK)             │◄───│ categoryId (FK)     │             │
│ name (unique)       │ 1:N│ createdById (FK)    │─────────────┘
│ color               │    │ title               │
│ icon                │    │ description         │
└─────────────────────┘    │ location            │
                           │ startTime           │
                           │ endTime             │
                           │ allDay              │
                           │ timezone            │
                           └──────────┬──────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │ 1:N                             │ 1:N
                     ▼                                 ▼
          ┌─────────────────────┐         ┌─────────────────────┐
          │   EventAttendee     │         │    EventInvite      │
          ├─────────────────────┤         ├─────────────────────┤
          │ id (PK)             │         │ id (PK)             │
          │ eventId (FK)        │         │ eventId (FK)        │
          │ userId (FK)         │         │ recipientEmail      │
          │ status (enum)       │         │ sentAt              │
          └─────────────────────┘         └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       Financial Data (Standalone)                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            transactions                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ transaction_id (PK)     │ INT, AUTO_INCREMENT                               │
│ transaction_date        │ DATE, NOT NULL                                    │
│ transaction_time        │ TIME, NULLABLE                                    │
│ account_id              │ VARCHAR(50), NOT NULL (derived entity)            │
│ account_name            │ VARCHAR(100), NOT NULL                            │
│ account_type            │ VARCHAR(20), CHECK ('Checking', 'Savings')        │
│ account_owner           │ VARCHAR(50), NOT NULL                             │
│ description             │ VARCHAR(255), NOT NULL                            │
│ category                │ VARCHAR(50), NOT NULL                             │
│ subcategory             │ VARCHAR(50), NULLABLE                             │
│ amount                  │ DECIMAL(18,2), NOT NULL                           │
│ transaction_type        │ VARCHAR(20), CHECK ('Income','Expense','Transfer')│
│ balance_after           │ DECIMAL(18,2), NULLABLE                           │
│ is_recurring            │ BIT, DEFAULT 0                                    │
│ recurring_frequency     │ VARCHAR(20), NULLABLE                             │
│ notes                   │ TEXT, NULLABLE                                    │
│ created_at              │ DATETIME, DEFAULT GETDATE()                       │
│ updated_at              │ DATETIME, DEFAULT GETDATE()                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ INDEXES: idx_date_account, idx_category_date, idx_type_date, idx_recurring  │
└─────────────────────────────────────────────────────────────────────────────┘

Note: Account is a DERIVED entity (computed from distinct account_id values)
      Category is a DERIVED entity (computed from distinct category/subcategory)
```

### Prisma Schema Overview

```prisma
// Enums
enum UserRole { ADMIN, MEMBER }
enum AttendeeStatus { PENDING, ACCEPTED, DECLINED, TENTATIVE }

// Authentication
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  name                String
  passwordHash        String
  role                UserRole  @default(MEMBER)
  avatarColor         String?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  // Relations
  eventsCreated       Event[]   @relation("EventCreator")
  eventsInvited       EventAttendee[]
  @@map("users")
}

// Calendar
model EventCategory {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String
  icon      String?
  events    Event[]
  @@map("event_categories")
}

model Event {
  id             String    @id @default(cuid())
  title          String
  description    String?
  location       String?
  startTime      DateTime
  endTime        DateTime
  allDay         Boolean   @default(false)
  timezone       String    @default("America/New_York")
  recurrenceRule String?
  // Relations
  categoryId     String?
  category       EventCategory? @relation(...)
  createdById    String
  createdBy      User      @relation("EventCreator", ...)
  attendees      EventAttendee[]
  invitesSent    EventInvite[]
  @@index([startTime, endTime])
  @@map("events")
}

model EventAttendee {
  id       String         @id @default(cuid())
  eventId  String
  userId   String
  status   AttendeeStatus @default(PENDING)
  event    Event          @relation(...)
  user     User           @relation(...)
  @@unique([eventId, userId])
  @@map("event_attendees")
}

model EventInvite {
  id             String   @id @default(cuid())
  eventId        String
  recipientEmail String
  sentAt         DateTime @default(now())
  event          Event    @relation(...)
  @@map("event_invites")
}

// Finance (existing database)
model Transaction {
  transaction_id      Int       @id @default(autoincrement())
  transaction_date    DateTime  @db.Date
  transaction_time    DateTime? @db.Time
  account_id          String
  account_name        String
  account_type        String
  account_owner       String
  description         String
  category            String
  subcategory         String?
  amount              Decimal   @db.Decimal(18, 2)
  transaction_type    String
  balance_after       Decimal?  @db.Decimal(18, 2)
  is_recurring        Boolean   @default(false)
  recurring_frequency String?
  notes               String?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
  @@map("transactions")
}
```

---

## 5. API Layer

### API Contract Pattern

All API routes follow a consistent pattern:

```typescript
// Standard API Route Structure
import { NextRequest, NextResponse } from 'next/server';
import { someSchema } from '@/lib/validations';
import { someQuery } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = someSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // 2. Execute query
    const data = await someQuery(result.data);

    // 3. Return consistent response shape
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Response Shapes:**
- Success: `{ data: T }`
- Error: `{ error: string }`

### Endpoint Summary

#### Analytics API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/kpis` | Net cash flow, balance, recurring expenses |
| GET | `/api/analytics/cash-flow` | Income vs expenses over time |
| GET | `/api/analytics/categories` | Spending breakdown by category |
| GET | `/api/analytics/accounts` | Account list with balances |
| GET | `/api/analytics/transfers` | Money flow between accounts |
| GET | `/api/analytics/recurring` | Detected recurring patterns |
| POST | `/api/analytics/recurring/[id]/confirm` | Confirm recurring pattern |
| POST | `/api/analytics/recurring/[id]/reject` | Reject recurring pattern |

#### Transactions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions with filters |
| GET | `/api/export/csv` | Export transactions to CSV |

#### Events API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events with optional filters |
| POST | `/api/events` | Create new event |
| GET | `/api/events/upcoming` | Get next N events within M days (landing page) |
| GET | `/api/events/[id]` | Get event with attendees |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |
| POST | `/api/events/[id]/send-invite` | Send email invitation |

#### Categories API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List event categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/[id]` | Update category |
| DELETE | `/api/categories/[id]` | Delete category |

#### Users API (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| GET | `/api/users/[id]` | Get user details |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |

#### Filter Options API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/filters/accounts` | Available accounts |
| GET | `/api/filters/categories` | Transaction categories |
| GET | `/api/filters/date-ranges` | Date range presets |

#### Reader API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reader/tree` | Get directory structure (lazy-loaded) |
| GET | `/api/reader/file` | Get file content for rendering |
| GET | `/api/reader/search` | Search files by name |
| GET | `/api/reader/preferences` | Get user preferences (favorites, recents, display mode) |
| PUT | `/api/reader/preferences` | Update user preferences |
| GET | `/api/reader/image` | Serve images from docs directory |

#### Email Utility API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/test` | Send test email (admin only) |

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                           │
└─────────────────────────────────────────────────────────────────┘

User → Login Form → POST /api/auth/[...nextauth]
                           │
                    ┌──────┴──────┐
                    │  Validate   │
                    │ Credentials │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │  Success  │  │  Failed   │  │  Locked   │
    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
          │              │              │
          ▼              ▼              ▼
    Create JWT      Increment     Return Error
    Session (7d)    Failed Count  "Account locked"
          │              │
          ▼              ▼
    Redirect to    5 failures →
    Dashboard      Lock 30 min

Session Storage: JWT tokens (no database session table)
Session Duration: 7 days
Lockout: 5 failed attempts → 30 minute lock
```

### Service Layer Pattern

The Markdown Reader introduces a service layer for encapsulating business logic:

```typescript
// Service classes encapsulate domain logic
export class FileSystemService {
  private docsRoot: string;

  validatePath(path: string): void;           // Security validation
  resolvePath(relativePath: string): string;  // Safe path resolution
  isValidDocumentPath(path: string): boolean; // Extension allowlist check
}

export class PreferencesService {
  async getPreferences(): Promise<ReaderPreferences>;
  async updatePreferences(update: Partial<ReaderPreferences>): Promise<void>;
  async toggleFavorite(path: string, name: string): Promise<void>;
  async addRecent(path: string, name: string): Promise<void>;
}
```

**Benefits:**
- Reusable business logic across API routes
- Testable in isolation (dependency injection)
- Clear separation of concerns
- Centralized security validation

**Data Flow with Service Layer:**

```
API Route (/api/reader/file)
      ↓
Zod Validation (reader.ts)
      ↓
Service Layer (FileSystemService)
      ↓
File System (DOCS_ROOT)
```

### Security Architecture

#### Path Traversal Prevention (Markdown Reader)

The FileSystemService implements defense-in-depth security:

```typescript
// Multi-layer validation
1. Input validation: Rejects "..", null bytes, empty paths
2. Path resolution: Uses path.join() with DOCS_ROOT
3. Defense in depth: Verifies resolved path is within DOCS_ROOT
4. Extension allowlisting: Only .md, .mmd, .txt files allowed
```

**Security Features:**
- Regex-based `..` detection (handles URL encoding)
- Blocks access to hidden files (starting with `.`)
- Blocks access to `.reader-prefs.json` configuration file
- All paths normalized before validation
- Read-only access (no write operations via API except preferences)

#### File System Sandboxing

All file operations are sandboxed within `DOCS_ROOT`:
- No access to parent directories
- No symlink following outside sandbox
- Strict extension allowlist enforcement

---

## 6. Frontend Architecture

### Context-Aware Component Pattern

Dashboard components have dual implementations for flexibility:

```
┌─────────────────────────────────────────────────────────────────┐
│              Context-Aware Component Pattern                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐    ┌─────────────────────────────┐
│   Context-Aware Version     │    │    Prop-Based Version       │
│   (FilteredKPICards)        │    │    (KPICards)               │
├─────────────────────────────┤    ├─────────────────────────────┤
│ - Consumes FilterContext    │    │ - Accepts props directly    │
│ - Used in dashboard pages   │───▶│ - Directly testable         │
│ - Auto-reacts to filters    │    │ - Can be used standalone    │
└─────────────────────────────┘    └─────────────────────────────┘
```

**Implementation Example:**

```typescript
// Prop-based (testable)
interface KPICardsProps {
  startDate: Date;
  endDate: Date;
  accountIds: string[];
}

export function KPICards({ startDate, endDate, accountIds }: KPICardsProps) {
  // Fetch and render using props
}

// Context-aware (dashboard use)
export function FilteredKPICards() {
  const { dateRange, selectedAccountIds } = useFilters();
  return (
    <KPICards
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds}
    />
  );
}
```

### Shell Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                       Shell Pattern                              │
└─────────────────────────────────────────────────────────────────┘

Server Component (layout.tsx)
├── Metadata generation
├── Static shell markup
└── Children slot
    │
    └── Client Component (DashboardShell)
        ├── FilterProvider (context)
        ├── FilterSidebar (UI)
        └── Content Area (children)
```

**Why this pattern?**
- Server components handle metadata and SEO
- Client shell provides interactivity and context
- Clear separation of concerns
- Optimal hydration performance

### State Management

| Context | Purpose | Provider Location |
|---------|---------|-------------------|
| FilterContext | Dashboard filters (date range, accounts) | `DashboardShell` |
| ReaderContext | File navigation, content viewing, preferences | `ReaderLayout` |
| ThemeContext | Light/Dark mode preference | `RootLayout` |
| SessionContext | Auth state (NextAuth) | `RootLayout` |

**FilterContext State:**

```typescript
interface FilterContextValue {
  // State
  dateRangeKey: string;              // 'this-month', 'last-3-months', etc.
  dateRange: { start: Date; end: Date };
  customDateRange: { start: Date; end: Date } | null;
  selectedAccountIds: string[];
  accounts: Account[];
  isLoading: boolean;

  // Actions
  setDateRange: (key: string, custom?: DateRange) => void;
  setSelectedAccounts: (ids: string[]) => void;
  resetFilters: () => void;

  // Utilities
  buildFilterQueryParams: () => URLSearchParams;
}
```

**ReaderContext State:**

```typescript
interface ReaderContextValue {
  // Navigation
  currentPath: string | null;
  expandedPaths: Set<string>;
  searchQuery: string;
  searchResults: FileNode[];

  // Content
  currentFile: FileContent | null;
  headings: DocumentHeading[];
  isLoading: boolean;
  error: string | null;

  // Preferences
  displayMode: 'themed' | 'reading';
  tocVisible: boolean;
  navPaneVisible: boolean;

  // Quick Access
  recentFiles: RecentFile[];
  favorites: Favorite[];

  // Actions
  selectFile: (path: string) => Promise<void>;
  toggleExpand: (path: string) => void;
  setSearchQuery: (query: string) => void;
  setHeadings: (headings: DocumentHeading[]) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleToc: () => void;
  toggleNavPane: () => void;
  toggleFavorite: (path: string, name: string) => Promise<void>;
  isFavorite: (path: string) => boolean;
}
```

### Server/Client Component Split

| Type | Use For | Examples |
|------|---------|----------|
| **Server** | Metadata, layouts, data fetching | `layout.tsx`, `page.tsx` (default) |
| **Client** | Interactivity, hooks, events | Forms, modals, charts, filters |

**Client Component Indicators:**
- `"use client"` directive at top of file
- Uses hooks (`useState`, `useEffect`, `useContext`)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `window`)

### Styling

| Tool | Purpose |
|------|---------|
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible components |
| **CSS Variables** | Theme tokens (`--bg-page`, `--text-primary`) |
| **cn() utility** | Conditional class merging (clsx + tailwind-merge) |

---

## 7. Testing Strategy

### Three-Tier Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Testing Pyramid                                │
└─────────────────────────────────────────────────────────────────┘

                        ┌───────────┐
                        │   E2E     │  Playwright
                        │  (slow)   │  Full user workflows
                        └─────┬─────┘
                              │
                    ┌─────────┴─────────┐
                    │   Integration     │  Vitest
                    │    (medium)       │  API routes + DB
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │           Unit                │  Vitest
              │          (fast)               │  Components, queries, utils
              └───────────────────────────────┘
```

### Test Categories

| Type | Framework | Location | Purpose |
|------|-----------|----------|---------|
| **Unit** | Vitest + RTL | `__tests__/unit/` | Components, queries, utilities |
| **Integration** | Vitest | `__tests__/integration/` | API routes with real DB |
| **E2E** | Playwright | `__tests__/e2e/` | Full user workflows |

### Test Database Setup

```typescript
// __tests__/helpers/test-db.ts

// Mode 1: Existing DB (default, fast)
// Reuses docker-compose MSSQL on port 1434

// Mode 2: Container (CI/CD)
// Spins up ephemeral MSSQL via Testcontainers

// Utilities
setupTestDatabase()    // Initialize test DB
teardownTestDatabase() // Cleanup connections
clearTestData()        // Wipe tables between tests
seedTestData(count)    // Generate sample transactions
```

### Coverage Requirements

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

### TDD Workflow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR │────▶│ COMMIT │
│         │     │         │     │          │     │        │
│ Write   │     │ Minimal │     │ Clean up │     │ test:  │
│ failing │     │ code to │     │ keeping  │     │ or     │
│ test    │     │ pass    │     │ tests    │     │ feat:  │
└─────────┘     └─────────┘     │ green    │     └────────┘
                                └──────────┘
```

### Running Tests

```bash
# Unit and Integration
npm test                 # Run all tests
npm run test:ui          # Interactive UI
npm run test:coverage    # With coverage report

# E2E
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # Interactive Playwright UI

# Single file
npx vitest run __tests__/unit/components/kpi-card.test.tsx
```

---

## 8. Infrastructure

### Docker Configuration

```yaml
# docker-compose.yml
services:
  db:
    image: mcr.microsoft.com/mssql/server:2025-latest
    container_name: cemdash-db
    ports:
      - "1434:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P $$SA_PASSWORD -Q "SELECT 1"
      interval: 10s
      timeout: 3s
      retries: 10

  web:
    build: .
    container_name: cemdash-web
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
```

### Database Connection

```
# .env.local
DATABASE_URL="sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Prisma connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing key | Yes |
| `NEXTAUTH_URL` | Auth callback base URL | Yes |
| `DOCS_ROOT` | Markdown documentation directory path | Yes (Reader) |
| `SMTP_HOST` | Email server | Optional |
| `SMTP_PORT` | Email port | Optional |
| `SMTP_USER` | Email username | Optional |
| `SMTP_PASS` | Email password | Optional |

---

## 9. Development Workflow

### Getting Started

```bash
# 1. Clone and install
git clone <repository>
cd Home-Dashboard
npm install

# 2. Start database
docker compose up -d

# 3. Setup environment
cp .env.example .env.local
# Edit DATABASE_URL in .env.local

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations (if needed)
npx prisma migrate dev

# 6. Start development server
npm run dev
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Run production build

# Database
docker compose up -d     # Start MSSQL
docker compose down      # Stop MSSQL
npx prisma studio        # Visual DB browser
npx prisma generate      # Regenerate client
npx prisma migrate dev   # Run migrations

# Testing
npm test                 # Unit + integration tests
npm run test:coverage    # With coverage
npm run test:e2e         # E2E tests

# Linting
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

### Feature Development Process

```
1. Create feature spec
   └── specs/[###-feature-name]/spec.md

2. Plan implementation
   └── /speckit.plan → generates plan.md, research.md, contracts/

3. Generate tasks
   └── /speckit.tasks → generates tasks.md

4. Implement (TDD)
   └── /speckit.implement → executes tasks.md

   For each task:
   ├── RED: Write failing test
   ├── GREEN: Implement minimum code
   ├── REFACTOR: Clean up
   └── COMMIT: test: or feat: prefix

5. Verify
   └── npm test && npm run build
```

### Git Workflow

```
main
  │
  └── feature/[###-feature-name]
       │
       ├── test: add failing test for X
       ├── feat: implement X
       ├── refactor: extract Y
       └── ...

Commit message format:
  type: description

  Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Appendix: Quick Reference

### Key Files

| Purpose | File |
|---------|------|
| Root layout | `app/layout.tsx` |
| Prisma schema | `prisma/schema.prisma` |
| Filter context | `lib/contexts/filter-context.tsx` |
| Theme config | `lib/theme/themes/` |
| API validations | `lib/validations/` |
| Query functions | `lib/queries/` |
| Test helpers | `__tests__/helpers/` |
| Project constitution | `.specify/memory/constitution.md` |

### Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| App Router | Server/client component optimization |
| Context-aware components | Testability + dashboard integration |
| Zod validation | Type-safe API contracts |
| Query separation | Reusable across routes |
| CSS variables for themes | Runtime switching without re-render |
| Testcontainers | Isolated integration tests |

---

*Generated: 2026-01-20*
