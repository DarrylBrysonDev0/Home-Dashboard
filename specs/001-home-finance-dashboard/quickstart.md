# Quickstart: Home Finance Dashboard
**Feature**: Home Finance Dashboard  
**Branch**: `001-home-finance-dashboard`  
**Date**: 2026-01-07

## Overview

This quickstart guide will help you set up and run the Home Finance Dashboard locally, covering database setup, dependency installation, and running the Next.js development server.

---

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 18+** installed
- **Git** for version control
- **Linux/macOS** terminal (or WSL on Windows)

---

## 1. Clone Repository and Checkout Branch

```bash
cd /home/dev0/repos/Home-Dashboard
git checkout 001-home-finance-dashboard
```

---

## 2. Database Setup

### Start MSSQL Container

The database is already configured in `docker-compose.yml`:

```bash
# Start database container
docker compose up -d

# Wait for MSSQL to initialize (15 seconds)
sleep 15

# Verify container is running
docker ps | grep cemdash-db
```

### Connection Details

- **Container**: `cemdash-db`
- **Database**: `HomeFinance-db`
- **Host Port**: `1434`
- **Username**: `sa`
- **Password**: `YourStrong@Password123`
- **Connection String**: 
  ```
  sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true
  ```

### Verify Database

```bash
# Connect via sqlcmd
docker exec -it cemdash-db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Password123' -d HomeFinance-db -C

# Run test query
1> SELECT COUNT(*) AS total_transactions FROM transactions;
2> GO

# Expected output: 1117 transactions
```

---

## 3. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify package.json contains:
# - next (14+)
# - react, react-dom (18+)
# - typescript
# - @prisma/client, prisma
# - tailwindcss
# - shadcn/ui components
# - recharts, @tanstack/react-table
# - react-hook-form, zod
# - lucide-react, sonner
# - date-fns
```

---

## 4. Configure Environment Variables

Create `.env.local` in project root:

```bash
# .env.local
DATABASE_URL="sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true"
NODE_ENV=development
```

---

## 5. Initialize Prisma

### Pull Existing Schema

```bash
# Generate Prisma schema from existing database
npx prisma db pull

# This creates/updates prisma/schema.prisma
```

### Generate Prisma Client

```bash
# Generate TypeScript types and Prisma Client
npx prisma generate

# Verify client is generated in node_modules/@prisma/client
```

### Open Prisma Studio (Optional)

```bash
# Open GUI to browse database
npx prisma studio

# Opens browser at http://localhost:5555
```

---

## 6. Run Development Server

```bash
# Start Next.js dev server
npm run dev

# Server starts at http://localhost:3000
```

### Expected Output

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## 7. Verify Setup

### Check Database Connection

Navigate to `http://localhost:3000/api/transactions` (once API route is implemented):

Expected response:
```json
{
  "data": {
    "transactions": [...],
    "total_count": 1117
  }
}
```

### Check Dashboard Page

Navigate to `http://localhost:3000/dashboard`:

Should see:
- KPI cards (Net Cash Flow, Total Balance, etc.)
- Cash Flow Chart
- Category Breakdown
- Transaction Table

---

## 8. Run Tests (After Implementation)

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Expected: 80%+ coverage for business logic
```

### Integration Tests

```bash
# Run integration tests (uses testcontainers)
npm run test:integration

# Note: Requires Docker running
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode for debugging
npx playwright test --ui
```

---

## 9. Development Workflow

### TDD Red-Green-Refactor Cycle

1. **RED**: Write failing test
   ```bash
   # Example: Create test file
   touch __tests__/unit/queries/transactions.test.ts
   npm run test -- transactions.test.ts
   # Test should fail (no implementation yet)
   ```

2. **GREEN**: Implement minimum code to pass
   ```bash
   # Write implementation in lib/queries/transactions.ts
   npm run test -- transactions.test.ts
   # Test should pass
   ```

3. **REFACTOR**: Clean up code
   ```bash
   # Refactor implementation
   npm run test -- transactions.test.ts
   # Test should still pass
   ```

### Type Checking

```bash
# Run TypeScript compiler (no emit)
npx tsc --noEmit

# Should have zero errors
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

---

## 10. Common Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start database container |
| `docker compose down` | Stop database container |
| `docker logs cemdash-db` | View database logs |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npx prisma studio` | Open Prisma GUI |
| `npx prisma db pull` | Sync schema from database |
| `npx prisma generate` | Generate Prisma Client |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Run ESLint |

---

## 11. Troubleshooting

### Database Connection Fails

**Problem**: `Connection refused` or `Login failed for user 'sa'`

**Solution**:
```bash
# Check container is running
docker ps | grep cemdash-db

# Restart container
docker compose restart

# Check logs for errors
docker logs cemdash-db

# Wait 15 seconds after restart
sleep 15
```

### Prisma Client Not Found

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
# Regenerate Prisma Client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Port 3000 Already in Use

**Problem**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### TypeScript Errors

**Problem**: Type errors in IDE or build

**Solution**:
```bash
# Ensure Prisma Client is generated
npx prisma generate

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Check for type errors
npx tsc --noEmit
```

---

## 12. Next Steps

After completing this quickstart:

1. **Read Spec**: Review `specs/001-home-finance-dashboard/spec.md` for detailed requirements
2. **Review Data Model**: Read `specs/001-home-finance-dashboard/data-model.md`
3. **Check API Contracts**: Explore `specs/001-home-finance-dashboard/contracts/`
4. **Start Implementation**: Follow TDD workflow starting with P1 User Story 1
5. **Refer to Constitution**: Keep `.specify/memory/constitution.md` principles in mind

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Recharts**: https://recharts.org
- **TanStack Table**: https://tanstack.com/table
- **Vitest**: https://vitest.dev
- **Playwright**: https://playwright.dev

---

## Support

For issues or questions:
- Check `specs/001-home-finance-dashboard/plan.md` for technical decisions
- Review `specs/001-home-finance-dashboard/research.md` for research findings
- Consult `.specify/memory/constitution.md` for architectural principles
