# HomeFinance Database Setup

## Overview
The HomeFinance database has been successfully set up in a Docker container with persistent storage.

## Database Details
- **Database Name**: HomeFinance-db
- **Container**: cemdash-db
- **Port**: 1434 (host) → 1433 (container)
- **Credentials**: sa / YourStrong@Password123

## Data Summary
- **Total Transactions**: 1,116
- **Unique Accounts**: 6
- **Date Range**: 2024-01-01 to 2024-12-31

## Files Created
- `docker-compose.yml` - MSSQL Server container configuration with persistent volume
- `db-init/01-init-db.sql` - Database initialization script
- `import-csv.py` - Python script for CSV import
- `requirements.txt` - Python dependencies (pyodbc)

## Connection String
```
sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true
```

## Quick Commands

### Start Database
```bash
docker compose up -d
```

### Stop Database
```bash
docker compose down
```

### Connect to Database
```bash
docker exec -it cemdash-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123' -d HomeFinance-db -C
```

### Reimport Data
```bash
python3 import-csv.py
```

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_time TIME NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_owner VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    amount DECIMAL(18, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    balance_after DECIMAL(18, 2),
    is_recurring BIT,
    recurring_frequency VARCHAR(50),
    notes VARCHAR(1000),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

### Indexes
- `IX_transactions_date` - On transaction_date (DESC)
- `IX_transactions_account` - On account_id
- `IX_transactions_category` - On category, subcategory
- `IX_transactions_type` - On transaction_type

### Views
- `vw_expense_summary` - Aggregated expense summary by account, category, and month

## Persistent Storage
Data is stored in a Docker named volume: `mssql-data`

This ensures data persists across container restarts and removals.
