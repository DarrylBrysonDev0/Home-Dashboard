# Feature Specification: Home Finance Dashboard

**Feature Branch**: `001-home-finance-dashboard`  
**Created**: January 7, 2026  
**Status**: Draft  
**Input**: User description: "Develop a Home Finance Dashboard with metrics, charts, and transaction tracking for personal financial health monitoring"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Financial Health Summary (Priority: P1)

As a homeowner, I want to see my overall financial health at a glance when I open the dashboard, so I can quickly understand my current financial position without analyzing individual transactions.

**Why this priority**: The financial summary is the core value proposition - users need immediate insight into their net cash flow, total balance, and key metrics to make informed financial decisions.

**Independent Test**: Can be fully tested by displaying the top-level KPI cards (Net Cash Flow, Total Balance, Month-over-Month Change, Recurring Expenses, Largest Expense) with sample transaction data and verifies the dashboard delivers immediate financial awareness.

**Acceptance Scenarios**:

1. **Given** I have transactions loaded in the system, **When** I open the dashboard, **Then** I see KPI cards showing Net Cash Flow, Current Total Balance, Month-over-Month Change, Recurring Expenses total, and Largest Expense for the current period
2. **Given** my total balance has increased since last month, **When** I view the dashboard, **Then** the Month-over-Month Change displays a positive percentage with a green upward trend indicator
3. **Given** my total balance has decreased since last month, **When** I view the dashboard, **Then** the Month-over-Month Change displays a negative percentage with a coral/red downward trend indicator
4. **Given** I have no transactions in the selected period, **When** I view the dashboard, **Then** the KPI cards display $0 values with appropriate empty state messaging

---

### User Story 2 - View Cash Flow Over Time (Priority: P1)

As a homeowner, I want to visualize my income versus expenses over time, so I can understand my spending patterns and identify months where I spent more than I earned.

**Why this priority**: Cash flow visualization is essential for understanding financial trajectory - it directly answers "am I saving or overspending?" which is the primary question users have.

**Independent Test**: Can be tested independently by displaying a full-width cash flow chart with sample income and expense data across multiple months, allowing users to identify positive vs negative cash flow periods.

**Acceptance Scenarios**:

1. **Given** I have income and expense transactions, **When** I view the Cash Flow Overview chart, **Then** income displays as positive values (mint green) and expenses display as negative values (coral)
2. **Given** I have inter-account transfers, **When** I view the Cash Flow Overview chart, **Then** transfers are excluded from income/expense calculations to prevent double-counting
3. **Given** I select a different time period, **When** the chart refreshes, **Then** the cash flow data updates to show only transactions within that period
4. **Given** I hover over a bar in the chart, **When** the tooltip appears, **Then** it shows the specific date/period, income amount, expense amount, and net amount

---

### User Story 3 - Filter Transactions by Time and Account (Priority: P1)

As a homeowner, I want to filter my financial data by date range and specific accounts, so I can focus on the information most relevant to my current needs.

**Why this priority**: Filtering is foundational to all dashboard interactions - without it, users cannot customize their view or analyze specific periods/accounts.

**Independent Test**: Can be tested by providing time filter buttons and account selector dropdown, then verifying all charts and metrics update based on selected filters.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I click a quick select time button (This Month, Last Month, Last 3 Months, etc.), **Then** all charts and metrics refresh to show data for that period
2. **Given** I want a specific date range, **When** I use the custom date picker, **Then** I can select start and end dates and all data updates accordingly
3. **Given** I have multiple accounts, **When** I select specific accounts from the multi-select dropdown, **Then** only transactions from those accounts appear in charts and calculations
4. **Given** I have filters applied, **When** I click "All Accounts" or reset filters, **Then** the dashboard returns to showing all data

---

### User Story 4 - View Spending by Category (Priority: P2)

As a homeowner, I want to see my spending broken down by category, so I can identify where most of my money goes and find opportunities to reduce expenses.

**Why this priority**: Category breakdown enables actionable insights - users can see if they're overspending on dining, subscriptions, etc. and make informed budget decisions.

**Independent Test**: Can be tested by displaying a donut chart with percentage breakdown and horizontal bar chart with amounts per category, using categorized transaction data.

**Acceptance Scenarios**:

1. **Given** I have categorized expenses, **When** I view the Spending by Category section, **Then** I see a donut chart showing percentage distribution and a horizontal bar chart showing absolute amounts
2. **Given** categories exist with varying amounts, **When** I view the category breakdown, **Then** categories are sorted by amount in descending order
3. **Given** I click on a category in the chart, **When** the drill-down activates, **Then** I see a filtered list of transactions in that category
4. **Given** a category has no expenses in the period, **When** I view the breakdown, **Then** that category is not displayed in the charts

---

### User Story 5 - Track Account Balance Trends (Priority: P2)

As a homeowner, I want to see how my account balances have changed over time, so I can monitor whether my savings are growing and my debts are decreasing.

**Why this priority**: Balance trends show long-term financial health trajectory - essential for tracking savings goals and debt payoff progress.

**Independent Test**: Can be tested by displaying a multi-line chart with one line per account showing balance over time, with ability to toggle individual accounts.

**Acceptance Scenarios**:

1. **Given** I have multiple accounts, **When** I view the Account Balance Trends chart, **Then** I see a separate line for each account with distinct colors from the chart palette
2. **Given** I want to focus on specific accounts, **When** I click an account in the legend, **Then** I can toggle that account line on/off
3. **Given** I hover over the chart, **When** my cursor crosses a data point, **Then** a tooltip shows the date, account name, and balance amount
4. **Given** the selected time period changes, **When** the chart updates, **Then** the balance trend lines adjust to show the new period

---

### User Story 6 - View and Manage Transaction Details (Priority: P2)

As a homeowner, I want to view a detailed list of all my transactions with sorting and filtering, so I can find specific transactions and review my financial activity.

**Why this priority**: The transaction table is the source of truth for all financial data - users need access to raw data for verification and detailed analysis.

**Independent Test**: Can be tested by displaying a sortable, filterable data table with all transaction fields and verifying sort/filter/search functionality works correctly.

**Acceptance Scenarios**:

1. **Given** I have transactions in the system, **When** I view the Transaction Details table, **Then** I see columns for Date, Account, Description, Category, Amount, and Balance
2. **Given** I want to sort by a column, **When** I click the column header, **Then** the table sorts by that column (ascending, then descending on second click)
3. **Given** I want to find specific transactions, **When** I type in the search field, **Then** the table filters to show only matching descriptions or categories
4. **Given** I want to export my data, **When** I click the Export button, **Then** the current filtered view downloads as a CSV file

---

### User Story 7 - Identify Recurring Transactions (Priority: P3)

As a homeowner, I want the system to automatically identify recurring transactions, so I can understand my fixed monthly expenses and track subscriptions.

**Why this priority**: Recurring transaction detection provides valuable automation - it surfaces subscription costs and predictable expenses without manual entry.

**Independent Test**: Can be tested by processing transaction history through the detection algorithm and displaying a table of identified recurring items with their frequency and next expected date.

**Acceptance Scenarios**:

1. **Given** I have transactions with similar descriptions and regular intervals, **When** the system analyzes my data, **Then** it identifies and flags these as recurring transactions
2. **Given** recurring transactions are identified, **When** I view the Recurring Transactions table, **Then** I see the description pattern, average amount, frequency, next expected date, account, and category
3. **Given** a transaction occurs 3+ times with <10% amount variance and regular intervals (weekly/monthly), **When** detection runs, **Then** it is flagged as recurring
4. **Given** I disagree with a recurring detection, **When** I manually unflag it, **Then** it is removed from the recurring transactions list

---

### User Story 8 - View Transfer Flow Between Accounts (Priority: P3)

As a homeowner, I want to visualize how money moves between my accounts, so I can understand my transfer patterns and ensure funds are allocated appropriately.

**Why this priority**: Transfer visualization helps users understand their money movement habits - useful but not critical for basic financial monitoring.

**Independent Test**: Can be tested by displaying a Sankey or flow diagram showing transfer amounts between accounts based on identified transfer transactions.

**Acceptance Scenarios**:

1. **Given** I have transfer transactions between accounts, **When** I view the Transfer Flow diagram, **Then** I see connections between accounts with width proportional to transfer amount
2. **Given** I select a date range filter, **When** the diagram updates, **Then** it shows only transfers within that period
3. **Given** accounts have no transfers between them, **When** I view the diagram, **Then** no connection is shown between those accounts
4. **Given** I hover over a flow connection, **When** the tooltip appears, **Then** it shows the source account, destination account, and total transferred amount

---

### User Story 9 - View Auto-Generated Financial Insights (Priority: P3)

As a homeowner, I want the dashboard to surface automatic insights about my finances, so I can be alerted to important changes without manually analyzing data.

**Why this priority**: Auto-insights add intelligence to the dashboard - they surface important information proactively, but the dashboard is still valuable without them.

**Independent Test**: Can be tested by implementing insight generation logic that compares current vs previous period data and displays actionable observations in an Insights Panel.

**Acceptance Scenarios**:

1. **Given** my spending in a category increased significantly, **When** I view the Insights Panel, **Then** I see a message like "Dining expenses up 23% vs last month"
2. **Given** I have recurring subscriptions, **When** I view insights, **Then** I see a summary like "You've spent $X on recurring subscriptions"
3. **Given** an unusually large transaction occurred, **When** I view insights, **Then** I see "Largest expense this month: [description] - $[amount]"
4. **Given** a transaction is >2 standard deviations from category average, **When** insights are generated, **Then** it is flagged as "Unusual transaction detected"

---

### Edge Cases

- What happens when a user has zero transactions for the selected period? → Display empty state with helpful message and icon
- How does the system handle transactions with missing category data? → Display as "Uncategorized" and include in totals
- What happens when a transfer is only recorded in one account? → Flag as potential data inconsistency
- How does the system handle duplicate transactions? → Detection based on same date, amount, and description within 24 hours
- What happens when balance calculations don't match the remaining balance field? → Display warning indicator and allow user to investigate discrepancy
- How does the system handle very long transaction descriptions? → Truncate with ellipsis at 120px in charts, show full text in tooltip

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display top-level KPI cards showing Net Cash Flow, Current Total Balance, Month-over-Month Change, Recurring Expenses, and Largest Expense
- **FR-002**: System MUST render a Cash Flow Overview chart showing income vs expenses over time with transfers excluded from totals
- **FR-003**: System MUST provide time period filters including quick-select buttons (This Month, Last Month, Last 3 Months, Last 6 Months, YTD, Last 12 Months, All Time) and custom date range picker
- **FR-004**: System MUST provide multi-select account filtering to show data for selected accounts only
- **FR-005**: System MUST display spending breakdown by category using donut chart and horizontal bar chart visualizations
- **FR-006**: System MUST render Account Balance Trends as a multi-line chart with toggleable account visibility
- **FR-007**: System MUST display a sortable, filterable transaction details table with columns for Date, Account, Description, Category, Amount, and Balance
- **FR-008**: System MUST support exporting transaction data to CSV format
- **FR-009**: System MUST automatically detect recurring transactions based on similar descriptions, regular intervals (7 days for weekly, 28-31 days for monthly), and <10% amount variance with minimum 3 occurrences
- **FR-010**: System MUST display identified recurring transactions in a dedicated table with description pattern, amount, frequency, next expected date, account, and category
- **FR-011**: System MUST render a Transfer Flow diagram showing money movement between accounts
- **FR-012**: System MUST generate and display automatic financial insights based on data analysis
- **FR-013**: System MUST display trend indicators (positive in mint green with up arrow, negative in coral with down arrow, neutral in gray)
- **FR-014**: System MUST support drilling down from category charts to view underlying transactions
- **FR-015**: System MUST properly handle inter-account transfers by tagging and excluding them from income/expense calculations
- **FR-016**: System MUST display appropriate empty states when no data exists for the selected filters
- **FR-017**: System MUST support search/filter within the transaction table by description or category
- **FR-018**: System MUST display loading skeleton states while data is being fetched

### Key Entities

- **Account**: Represents a financial account with:
  - `account_id`: Unique identifier (e.g., ACC-JOINT-CHK)
  - `account_name`: Display name (e.g., "Joint Checking")
  - `account_type`: Type classification (Checking, Savings)
  - `account_owner`: Owner designation (Joint, User1, User2)

- **Transaction**: Individual financial activity with:
  - `transaction_id`: Unique identifier
  - `transaction_date`: Date of transaction
  - `transaction_time`: Time of transaction
  - `account_id`: Reference to Account
  - `description`: Merchant/payee description
  - `category`: Primary category (e.g., Groceries, Dining, Housing)
  - `subcategory`: Secondary category (e.g., Supermarket, Fast Food, Mortgage/Rent)
  - `amount`: Transaction amount (positive for income, negative for expenses)
  - `transaction_type`: Classification (Income, Expense, Transfer)
  - `balance_after`: Running balance after transaction
  - `is_recurring`: Boolean flag for recurring transactions
  - `recurring_frequency`: Frequency pattern (Monthly, Biweekly, etc.)
  - `notes`: Optional notes field

- **Category**: Hierarchical classification with parent category and subcategory (e.g., Dining > Fast Food, Housing > Mortgage/Rent)

- **Transfer**: Transaction type linking source and destination accounts, identified by `transaction_type = 'Transfer'` with matching pairs across accounts

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their complete financial summary within 3 seconds of opening the dashboard
- **SC-002**: Users can filter and refresh dashboard data in under 1 second for typical data volumes (up to 10,000 transactions)
- **SC-003**: 90% of users can identify their top spending category within 10 seconds of viewing the dashboard
- **SC-004**: Recurring transaction detection achieves 85%+ accuracy (correctly identifies at least 85% of actual recurring transactions)
- **SC-005**: Users can export their transaction history in under 5 seconds for up to 5,000 transactions
- **SC-006**: Dashboard displays correctly on desktop viewports (1024px and above)
- **SC-007**: All chart visualizations render with correct data within 2 seconds of filter changes
- **SC-008**: Users can successfully drill down from category overview to transaction details in 2 clicks or less

## Development Methodology: TDD Red-Green *(mandatory)*

This feature MUST be developed using Test-Driven Development (TDD) with the Red-Green-Refactor cycle.

### TDD Cycle

For each functional requirement and user story acceptance scenario:

1. **RED**: Write a failing test that defines the expected behavior
   - Test should clearly describe the expected outcome
   - Test MUST fail initially (no implementation exists)
   - Commit the failing test

2. **GREEN**: Write the minimum code to make the test pass
   - Implement only what is needed to satisfy the test
   - Do not add extra functionality
   - Commit when test passes

3. **REFACTOR**: Improve code quality while keeping tests green
   - Clean up duplication, improve naming, optimize structure
   - All tests MUST remain passing
   - Commit the refactored code

### Test Categories

| Category | Purpose | Scope | When to Write |
|----------|---------|-------|---------------|
| **Unit Tests** | Verify individual functions/components in isolation | Single function, component, or module | Before implementing any business logic or component |
| **Integration Tests** | Verify components work together correctly | Database queries, API endpoints, component interactions | Before implementing database operations or API routes |
| **End-to-End Tests** | Verify complete user workflows | Full user story from UI to database | Before implementing each P1 user story |

### Acceptance Scenario → Test Mapping

Each **Given/When/Then** acceptance scenario in User Stories maps directly to a test case:

- **Given** → Test setup/preconditions (arrange)
- **When** → Action being tested (act)
- **Then** → Assertion of expected outcome (assert)

Example mapping from User Story 1:
```
Acceptance: Given I have transactions loaded, When I open the dashboard, Then I see KPI cards...
Test: "should display KPI cards with correct values when transactions exist"
```

### Test Coverage Requirements

- **Minimum 80% code coverage** for business logic (calculations, data transformations)
- **100% coverage** for all acceptance scenarios in P1 user stories
- **All edge cases** must have corresponding test cases
- **Database operations** must have integration tests with test container

## Test Environment & Data *(mandatory)*

### Development Database

Development and testing uses a Docker MSSQL container with persistent storage:

- **Container**: `mcr.microsoft.com/mssql/server:2025-latest`
- **Port**: 1434 (mapped from container 1433)
- **Persistent Volume**: `mssql-data:/var/opt/mssql`
- **Credentials**: Configured via environment variables

### Initial Data Seeding

On first container initialization, the system MUST import seed data:

- **Source File**: `research/homefinance_transactions.csv`
- **Records**: 1,117 transactions
- **Date Range**: Full year of transaction history
- **Accounts**: 6 accounts (Joint Checking, Joint Savings, User1 Checking, User1 Savings, User2 Checking, User2 Savings)

### Test Data Characteristics

The seed data includes realistic scenarios for testing:

| Characteristic | Value | Test Coverage |
|----------------|-------|---------------|
| Total Transactions | 1,117 | Performance testing with realistic volume |
| Account Types | Checking (4), Savings (2) | Multi-account filtering |
| Transaction Types | Income, Expense, Transfer | Cash flow calculations |
| Categories | ~15 parent categories | Category breakdown charts |
| Subcategories | ~25 subcategories | Drill-down functionality |
| Recurring Transactions | Pre-flagged with `is_recurring=True` | Recurring detection validation |
| Recurring Frequencies | Monthly, Biweekly | Frequency pattern testing |
| Transfers | Matched pairs between accounts | Transfer flow diagram |

### Test Database Lifecycle

1. **Setup**: Docker container starts with empty database
2. **Seed**: Import CSV data on first initialization
3. **Test Isolation**: Each test suite can use transactions or rollback
4. **Reset**: Container can be recreated for clean state

## Assumptions

- **TDD Methodology**: All features developed using Red-Green-Refactor cycle with tests written before implementation
- **Docker Development Environment**: Development and testing uses Docker MSSQL container with persistent storage
- **Seed Data Available**: `research/homefinance_transactions.csv` provides initial test data (1,117 transactions)
- Transaction data is imported from CSV files rather than connecting to live bank feeds
- The seed data includes pre-categorized transactions with `is_recurring` flags already set
- The dashboard is for single-user personal use (no multi-user or household sharing in initial scope)
- Standard web browser with JavaScript enabled is required
- Users understand basic financial terminology (income, expense, cash flow, etc.)
