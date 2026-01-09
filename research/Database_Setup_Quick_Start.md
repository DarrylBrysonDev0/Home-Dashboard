# Home Finance Dashboard - Database Setup Quick Start

## ✅ Database Setup Complete!

The HomeFinance database is now running with all transaction data imported.

## 📊 Current Status

- **Database**: HomeFinance-db (running in Docker)
- **Records**: 1,116 transactions imported
- **Date Range**: January 1 - December 31, 2024
- **Accounts**: 6 unique accounts tracked

## 🚀 Quick Start Commands

### Start the Database
```bash
docker compose up -d
```

### Stop the Database
```bash
docker compose down
```

### View Container Logs
```bash
docker logs cemdash-db
```

### Connect to Database (via sqlcmd)
```bash
docker exec -it cemdash-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Password123' \
  -d HomeFinance-db -C
```

### Sample Queries

```sql
-- Total transactions
SELECT COUNT(*) FROM transactions;

-- Transactions by category
SELECT category, COUNT(*) as count, SUM(amount) as total
FROM transactions
GROUP BY category
ORDER BY total;

-- Monthly spending
SELECT 
  YEAR(transaction_date) as year,
  MONTH(transaction_date) as month,
  SUM(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) ELSE 0 END) as expenses,
  SUM(CASE WHEN transaction_type = 'Income' THEN amount ELSE 0 END) as income
FROM transactions
GROUP BY YEAR(transaction_date), MONTH(transaction_date)
ORDER BY year, month;

-- Use the expense summary view
SELECT * FROM vw_expense_summary 
WHERE year = 2024 AND month = 12
ORDER BY total_amount;
```

## 📁 Project Structure

```
Home-Dashboard/
├── docker-compose.yml          # Database container config
├── db-init/
│   └── 01-init-db.sql         # Database initialization script
├── import-csv.py              # CSV import script
├── requirements.txt           # Python dependencies
├── research/
│   └── homefinance_transactions.csv  # Source data
└── DATABASE_SETUP.md          # Detailed setup documentation
```

## 🔗 Connection Details

**Connection String for Next.js:**
```
DATABASE_URL="sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true"
```

## 📦 Persistent Storage

Data is stored in Docker volume: `mssql-data`
- Survives container restarts
- Persists across container removals
- Can be backed up separately

## 🔄 Reimporting Data

If you need to reimport the CSV:
```bash
python3 import-csv.py
```

The script will prompt before overwriting existing data.

## 📚 Next Steps

1. **Set up Prisma**: Generate schema from existing database
2. **Create Next.js app**: Follow tech stack guide
3. **Build dashboard**: Create beautiful UI with shadcn/ui
4. **Add visualizations**: Use Recharts for charts and graphs

## 📖 Additional Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Complete database setup details
- [dashboard-tech-stack.md](research/dashboard-tech-stack.md) - Full tech stack guide

---

**Status**: ✅ Ready for development!
