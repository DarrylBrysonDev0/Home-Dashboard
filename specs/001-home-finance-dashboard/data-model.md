# Phase 1: Data Model
**Feature**: Home Finance Dashboard  
**Date**: 2026-01-07  
**Status**: Completed

## Overview

This document defines the data model for the Home Finance Dashboard, including entities, relationships, validation rules, and state transitions. The model is based on the existing MSSQL database schema and will be managed through Prisma ORM.

---

## Core Entities

### 1. Transaction

**Description**: Individual financial activity (income, expense, or transfer) with categorization and account association.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `transaction_id` | INT | PK, AUTO_INCREMENT | Unique identifier |
| `transaction_date` | DATE | NOT NULL | Date of transaction |
| `transaction_time` | TIME | NULLABLE | Time of transaction (optional precision) |
| `account_id` | VARCHAR(50) | NOT NULL, FK to Account | Reference to account (e.g., ACC-JOINT-CHK) |
| `account_name` | VARCHAR(100) | NOT NULL | Account display name (e.g., "Joint Checking") |
| `account_type` | VARCHAR(20) | NOT NULL, CHECK IN ('Checking', 'Savings') | Account classification |
| `account_owner` | VARCHAR(50) | NOT NULL | Owner designation (Joint, User1, User2) |
| `description` | VARCHAR(255) | NOT NULL | Merchant/payee description |
| `category` | VARCHAR(50) | NOT NULL | Primary category (e.g., Groceries, Dining) |
| `subcategory` | VARCHAR(50) | NULLABLE | Secondary category (e.g., Supermarket, Fast Food) |
| `amount` | DECIMAL(18, 2) | NOT NULL | Transaction amount (positive=income, negative=expense) |
| `transaction_type` | VARCHAR(20) | NOT NULL, CHECK IN ('Income', 'Expense', 'Transfer') | Transaction classification |
| `balance_after` | DECIMAL(18, 2) | NULLABLE | Running balance after transaction |
| `is_recurring` | BIT | NOT NULL, DEFAULT 0 | Flag for recurring transactions |
| `recurring_frequency` | VARCHAR(20) | NULLABLE, CHECK IN ('Weekly', 'Biweekly', 'Monthly') | Frequency pattern for recurring |
| `notes` | TEXT | NULLABLE | Optional user notes |
| `created_at` | DATETIME | NOT NULL, DEFAULT GETDATE() | Record creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT GETDATE() | Last update timestamp |

**Indexes**:
- `PRIMARY KEY (transaction_id)`
- `INDEX idx_date_account (transaction_date DESC, account_id)` - For filtered queries by date and account
- `INDEX idx_category_date (category, transaction_date DESC)` - For category breakdowns
- `INDEX idx_type_date (transaction_type, transaction_date DESC)` - For income/expense/transfer filtering
- `INDEX idx_recurring (is_recurring, recurring_frequency)` - For recurring transaction queries

**Validation Rules**:
- `transaction_date` must be <= current date (no future transactions)
- `amount` must be non-zero
- `transaction_type = 'Transfer'` requires matching inverse transaction in destination account
- `is_recurring = 1` requires `recurring_frequency` to be set
- `category` must match a valid category from the category list (see Categories entity)
- `account_id` format must match `ACC-{OWNER}-{TYPE}` pattern

**Relationships**:
- Many-to-One: `Transaction.account_id` → `Account.account_id`
- Self-referential: Transfer transactions link in pairs (source + destination)

---

### 2. Account

**Description**: Financial account (checking or savings) with owner designation. Note: This is a derived entity from the `transactions` table - accounts are inferred from distinct `account_id` values.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `account_id` | VARCHAR(50) | PK | Unique identifier (e.g., ACC-JOINT-CHK) |
| `account_name` | VARCHAR(100) | NOT NULL | Display name (e.g., "Joint Checking") |
| `account_type` | VARCHAR(20) | NOT NULL, CHECK IN ('Checking', 'Savings') | Account classification |
| `account_owner` | VARCHAR(50) | NOT NULL | Owner designation (Joint, User1, User2) |
| `current_balance` | DECIMAL(18, 2) | COMPUTED | Latest `balance_after` from most recent transaction |
| `last_transaction_date` | DATE | COMPUTED | Date of most recent transaction |

**Validation Rules**:
- `account_id` must be unique
- `account_type` must be 'Checking' or 'Savings'
- `account_owner` must match one of: 'Joint', 'User1', 'User2'

**Derivation Logic**:
```sql
-- Accounts derived from transactions table
SELECT DISTINCT 
  account_id, 
  account_name, 
  account_type, 
  account_owner,
  (SELECT TOP 1 balance_after 
   FROM transactions t2 
   WHERE t2.account_id = t1.account_id 
   ORDER BY transaction_date DESC, transaction_time DESC) AS current_balance,
  (SELECT TOP 1 transaction_date 
   FROM transactions t2 
   WHERE t2.account_id = t1.account_id 
   ORDER BY transaction_date DESC, transaction_time DESC) AS last_transaction_date
FROM transactions t1;
```

**Note**: Accounts are not stored as a separate table in the current database schema. This entity represents a logical grouping for API and UI purposes.

---

### 3. Category

**Description**: Hierarchical classification system for transactions (parent category + optional subcategory).

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `category` | VARCHAR(50) | Parent category (e.g., Dining, Housing, Groceries) |
| `subcategory` | VARCHAR(50) | Child category (e.g., Fast Food, Mortgage/Rent, Supermarket) |

**Validation Rules**:
- `category` is required for all transactions
- `subcategory` is optional but recommended for better breakdown
- Category hierarchy is flat (max 2 levels: parent → child)

**Predefined Categories** (based on seed data analysis):
- **Dining**: Fast Food, Restaurants, Coffee Shops
- **Groceries**: Supermarket, Convenience Store
- **Housing**: Mortgage/Rent, Utilities, Home Maintenance
- **Transportation**: Fuel, Public Transit, Parking
- **Entertainment**: Streaming Services, Movies, Hobbies
- **Healthcare**: Medical, Pharmacy, Insurance
- **Shopping**: Clothing, Electronics, Home Goods
- **Income**: Salary, Bonus, Refund, Interest
- **Transfer**: Between Accounts (internal)
- **Uncategorized**: Default for transactions without category

**Note**: Categories are not stored as a separate table but are derived from distinct values in the `transactions.category` and `transactions.subcategory` columns.

---

### 4. RecurringTransaction (Derived Entity)

**Description**: Computed entity representing automatically detected recurring transactions with confidence scoring.

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `pattern_id` | INT | Generated identifier for recurring pattern |
| `description_pattern` | VARCHAR(255) | Normalized description (e.g., "Netflix Subscription") |
| `account_id` | VARCHAR(50) | Account where recurring transaction occurs |
| `category` | VARCHAR(50) | Category of recurring transaction |
| `avg_amount` | DECIMAL(18, 2) | Average transaction amount |
| `frequency` | VARCHAR(20) | Detected frequency (Weekly, Biweekly, Monthly) |
| `next_expected_date` | DATE | Predicted next occurrence date |
| `confidence_level` | VARCHAR(10) | Confidence score (High, Medium, Low) |
| `confidence_score` | INT | Numeric confidence (50-100%) |
| `occurrence_count` | INT | Number of times transaction occurred |
| `last_occurrence_date` | DATE | Date of most recent occurrence |
| `is_confirmed` | BIT | Manual user confirmation flag |
| `is_rejected` | BIT | Manual user rejection flag |

**Derivation Logic**:
- Group transactions by fuzzy description similarity (80%+ match)
- Calculate interval statistics (mean, std dev) between transaction dates
- Calculate amount variance (coefficient of variation)
- Assign confidence based on regularity and variance
- Require minimum 3 occurrences

**Confidence Scoring Formula**:
```
Interval Regularity Score:
- Perfect intervals (±1 day): 50 points
- Good intervals (±2 days): 40 points
- Fair intervals (±3 days): 30 points

Amount Consistency Score:
- CV < 0.05: 40 points
- CV < 0.10: 30 points
- CV < 0.20: 20 points

Occurrence Bonus:
- 3-4 occurrences: 0 points
- 5-6 occurrences: 5 points
- 7+ occurrences: 10 points

Total = Regularity + Consistency + Bonus
High: 90-100
Medium: 70-89
Low: 50-69
```

**Note**: This entity is computed on-demand and not persisted. Results cached in application layer for performance.

---

### 5. TransferPair (Derived Entity)

**Description**: Linked pair of transfer transactions between accounts (source + destination).

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `source_transaction_id` | INT | Transaction ID of source (negative amount) |
| `destination_transaction_id` | INT | Transaction ID of destination (positive amount) |
| `source_account_id` | VARCHAR(50) | Account money is leaving |
| `destination_account_id` | VARCHAR(50) | Account money is entering |
| `amount` | DECIMAL(18, 2) | Transfer amount (absolute value) |
| `transfer_date` | DATE | Date of transfer |
| `is_matched` | BIT | Whether source and destination pair are found |

**Matching Logic**:
```sql
-- Find transfer pairs
SELECT 
  t1.transaction_id AS source_transaction_id,
  t2.transaction_id AS destination_transaction_id,
  t1.account_id AS source_account_id,
  t2.account_id AS destination_account_id,
  ABS(t1.amount) AS amount,
  t1.transaction_date AS transfer_date
FROM transactions t1
INNER JOIN transactions t2 ON 
  t1.transaction_date = t2.transaction_date AND
  ABS(t1.amount) = ABS(t2.amount) AND
  t1.transaction_type = 'Transfer' AND
  t2.transaction_type = 'Transfer' AND
  t1.amount < 0 AND t2.amount > 0 AND
  t1.account_id <> t2.account_id;
```

**Note**: Unmatched transfers (only source or destination recorded) are flagged as data inconsistencies.

---

## Relationships Diagram

```
┌─────────────────┐
│   Transaction   │
│  (Primary Table)│
├─────────────────┤
│ transaction_id  │◄──┐
│ account_id      │───┼──► (Derived) Account
│ category        │───┼──► (Derived) Category
│ is_recurring    │   │
│ ...             │   │
└─────────────────┘   │
         │             │
         │ (Self-ref)  │
         │ Transfer    │
         │ Pairs       │
         ▼             │
┌─────────────────┐   │
│  TransferPair   │   │
│   (Derived)     │   │
├─────────────────┤   │
│ source_txn_id   │───┘
│ dest_txn_id     │───┘
└─────────────────┘

┌──────────────────────┐
│ RecurringTransaction │
│      (Derived)       │
├──────────────────────┤
│ pattern_id           │
│ description_pattern  │
│ avg_amount           │
│ frequency            │
│ confidence_level     │
└──────────────────────┘
         ▲
         │ (Aggregates multiple transactions)
         │
    [Transaction 1]
    [Transaction 2]
    [Transaction 3+]
```

---

## State Transitions

### Transaction Lifecycle

```
[Created] ──────► [Active] ──────► [Updated] ──────► [Active]
                     │
                     └──────► [Recurring Detected] ──────► [Confirmed/Rejected]
```

**States**:
1. **Created**: New transaction inserted into database
2. **Active**: Normal transaction in system
3. **Updated**: Transaction edited (amount, category, etc.) - updates `updated_at`
4. **Recurring Detected**: System flags as recurring (`is_recurring = 1`)
5. **Confirmed**: User confirms recurring pattern
6. **Rejected**: User rejects recurring pattern (flag to prevent re-detection)

### Recurring Detection State

```
[Insufficient Data] ──────► [Candidate] ──────► [Detected] ──────► [Confirmed]
  (<3 occurrences)           (3+ matches)        (confidence     (user approval)
                                                  calculated)
                                                      │
                                                      └──────► [Rejected]
                                                              (user denial)
```

---

## Validation Rules Summary

### Cross-Entity Validation

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Transfer Balance** | Transfer out (negative) must have matching transfer in (positive) | Database query validation |
| **Category Consistency** | All transactions must use valid category from predefined list | Application-level validation with Zod |
| **Date Range** | `transaction_date` cannot be in future | Database CHECK constraint or API validation |
| **Recurring Requirements** | `is_recurring = 1` requires `recurring_frequency` to be set | Database CHECK constraint |
| **Amount Non-Zero** | `amount` cannot be 0 | Database CHECK constraint |
| **Account Format** | `account_id` must match `ACC-{OWNER}-{TYPE}` pattern | Application-level validation with Zod |

### Business Rules

| Rule | Description |
|------|-------------|
| **Transfer Exclusion** | Transfers (`transaction_type = 'Transfer'`) excluded from income/expense calculations in analytics |
| **Balance Calculation** | Account balance = SUM of all transactions for that account up to date |
| **Category Totals** | Category spending = SUM of negative amounts (expenses) for that category in date range |
| **Recurring Detection** | Minimum 3 occurrences, <10% amount variance, regular intervals (±3 days) |
| **Uncategorized Default** | Transactions without category default to "Uncategorized" |

---

## Prisma Schema Definition

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Transaction {
  transaction_id       Int       @id @default(autoincrement())
  transaction_date     DateTime  @db.Date
  transaction_time     DateTime? @db.Time
  account_id           String    @db.VarChar(50)
  account_name         String    @db.VarChar(100)
  account_type         String    @db.VarChar(20)
  account_owner        String    @db.VarChar(50)
  description          String    @db.VarChar(255)
  category             String    @db.VarChar(50)
  subcategory          String?   @db.VarChar(50)
  amount               Decimal   @db.Decimal(18, 2)
  transaction_type     String    @db.VarChar(20)
  balance_after        Decimal?  @db.Decimal(18, 2)
  is_recurring         Boolean   @default(false)
  recurring_frequency  String?   @db.VarChar(20)
  notes                String?   @db.Text
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt

  @@index([transaction_date(sort: Desc), account_id], name: "idx_date_account")
  @@index([category, transaction_date(sort: Desc)], name: "idx_category_date")
  @@index([transaction_type, transaction_date(sort: Desc)], name: "idx_type_date")
  @@index([is_recurring, recurring_frequency], name: "idx_recurring")
  @@map("transactions")
}
```

---

## Data Migration Strategy

### Phase 1: Schema Introspection
```bash
# Pull existing schema from MSSQL database
npx prisma db pull
```

### Phase 2: Schema Refinement
- Add indexes as defined above
- Add validation constraints
- Generate Prisma Client

### Phase 3: Seed Data Verification
- Verify 1,117 transactions imported correctly
- Check for data integrity issues (unmatched transfers, missing categories)
- Run validation queries

### No breaking changes required - database already exists and populated.

---

## Next Steps

Data model documented. Proceed to **API Contracts** (Phase 1).
