## **Key Performance Indicators (Top-Level Metrics)**

**Financial Health Summary:**
- **Net Cash Flow** - Total income minus expenses for selected period
- **Current Total Balance** - Sum across all accounts
- **Month-over-Month Change** - Percentage change in total balance
- **Recurring Expenses** - Monthly average of identified recurring items
- **Largest Expense** - Top transaction for the period
- **Budget Variance** - Actual vs planned spending (if you set budgets)

## **Primary Charts & Visualizations**

### 1. **Cash Flow Overview**
- **Type**: Waterfall chart or stacked area chart
- **Shows**: Income (positive) vs Expenses (negative) over time
- **Excludes**: Inter-account transfers (to avoid double-counting)
- **Time granularity**: Daily, weekly, or monthly bars

### 2. **Account Balance Trends**
- **Type**: Multi-line chart
- **Shows**: Balance trajectory for each account over time
- **Y-axis**: Balance amount
- **X-axis**: Date
- **Features**: Toggle individual accounts on/off

### 3. **Spending by Category**
- **Type**: Donut/pie chart + horizontal bar chart combo
- **Shows**: Percentage and absolute amounts per category
- **Sort**: By amount (descending)
- **Interaction**: Click to drill into specific category transactions

### 4. **Transaction Volume by Account**
- **Type**: Stacked bar chart
- **Shows**: Number of transactions per account
- **Segments**: Income (green), Expenses (red), Transfers (blue)
- **Time axis**: Grouped by your selected period

### 5. **Recurring Transactions Identifier**
- **Type**: Table with visual indicators
- **Columns**: 
  - Description pattern
  - Amount (with variance range)
  - Frequency (weekly, monthly, quarterly, annual)
  - Next expected date
  - Account
  - Category
- **Detection logic**: Similar descriptions + similar amounts + regular intervals

### 6. **Transfer Flow Diagram**
- **Type**: Sankey diagram or chord diagram
- **Shows**: Money movement between accounts
- **Width**: Proportional to transfer amount
- **Filters**: Date range to see transfer patterns

### 7. **Category Trend Analysis**
- **Type**: Small multiples (mini line charts)
- **Shows**: Spending trend for each category over time
- **Helps identify**: Categories with increasing/decreasing spending

## **Filtering & Control Panel**

### Time Horizon Controls:
- **Quick Select Buttons**: 
  - This Month | Last Month | Last 3 Months | Last 6 Months | Year to Date | Last 12 Months | All Time
- **Custom Date Range Picker**: Start date → End date
- **Comparison Toggle**: Compare to previous period

### Account Filters:
- **Multi-select dropdown**: Choose one or more accounts
- **Quick buttons**: "All Accounts" | "Checking Only" | "Savings Only" | "Credit Cards"

### Category Filters:
- **Multi-select with hierarchy**: 
  - Parent categories (Housing, Transportation, Food)
  - Sub-categories (Rent, Mortgage | Gas, Insurance | Groceries, Dining)

### Transaction Type Filter:
- **Checkboxes**: 
  - ☑ Income
  - ☑ Expenses
  - ☑ Transfers (with toggle to exclude from totals)

### Advanced Filters:
- **Amount range**: Min/max transaction size
- **Description search**: Find specific merchants/keywords
- **Recurring only**: Show only identified recurring items
- **Anomaly detection**: Highlight unusual transactions (>2 standard deviations from category average)

## **Additional Dashboard Sections**

### Transaction Detail Table
- **Sortable columns**: Date | Account | Description | Category | Amount | Balance
- **Features**: 
  - Search/filter in place
  - Export to CSV
  - Edit category or add notes
  - Flag as recurring or one-time

### Insights Panel
- Auto-generated observations like:
  - "Dining expenses up 23% vs last month"
  - "You've spent $X on recurring subscriptions"
  - "Largest expense this month: [description]"
  - "Unusual transaction detected: [description]"

## **Recommended Dashboard Layout**

```
┌─────────────────────────────────────────────────────────┐
│  TIME FILTERS & ACCOUNT SELECTOR                        │
├──────────────┬──────────────┬──────────────┬───────────┤
│ Net Cash Flow│ Total Balance│ Recurring    │ Largest   │
│    +$2,345   │   $15,430    │   $890/mo    │ $450      │
├──────────────┴──────────────┴──────────────┴───────────┤
│                                                          │
│  CASH FLOW OVERVIEW CHART (full width)                  │
│                                                          │
├──────────────────────────────┬──────────────────────────┤
│                              │                          │
│  ACCOUNT BALANCE TRENDS      │  SPENDING BY CATEGORY    │
│  (line chart)                │  (donut + bars)          │
│                              │                          │
├──────────────────────────────┴──────────────────────────┤
│                                                          │
│  RECURRING TRANSACTIONS TABLE                            │
│                                                          │
├──────────────────────────────┬──────────────────────────┤
│                              │                          │
│  TRANSFER FLOW DIAGRAM       │  CATEGORY TRENDS         │
│                              │  (small multiples)       │
│                              │                          │
├──────────────────────────────┴──────────────────────────┤
│                                                          │
│  DETAILED TRANSACTION TABLE (with filters)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## **Important Calculation Rules**

1. **Handling Transfers**: Tag inter-account transfers (e.g., "Transfer to Savings") and exclude from income/expense calculations to prevent double-counting

2. **Recurring Detection Algorithm**:
   - Group transactions by similar description (fuzzy matching)
   - Check for regular intervals (28-31 days for monthly, 7 days for weekly)
   - Amount variance < 10% (or exact match)
   - Minimum 3 occurrences to flag as recurring

3. **Balance Calculations**: Use the "remaining balance" field from your transaction log, validated by: Opening Balance + Sum(Income) - Sum(Expenses) ± Transfers

4. **Time Aggregation**: When showing monthly/quarterly data, use the transaction date, not processing date
