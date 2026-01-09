import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../../generated/prisma/client.js";

interface TestDatabaseContext {
  prisma: PrismaClient;
  container: StartedTestContainer | null;
}

// Configuration - use existing docker-compose db or spin up new container
const USE_EXISTING_DB = process.env.TEST_USE_EXISTING_DB !== "false";
const EXISTING_DB_HOST = process.env.TEST_DB_HOST || "localhost";
const EXISTING_DB_PORT = parseInt(process.env.TEST_DB_PORT || "1434", 10);
const EXISTING_DB_PASSWORD = process.env.TEST_DB_PASSWORD || "YourStrong@Password123";

// Container config (fallback)
const CONTAINER_SA_PASSWORD = "TestPass123!";
const TEST_DATABASE = "TestHomeFinanceDB";

let testContext: TestDatabaseContext | null = null;

/**
 * Sets up MSSQL for integration tests.
 * By default, connects to existing docker-compose db on port 1434.
 * Set TEST_USE_EXISTING_DB=false to spin up an ephemeral container.
 *
 * @returns TestDatabaseContext with Prisma client and optional container reference
 */
export async function setupTestDatabase(): Promise<TestDatabaseContext> {
  if (testContext) {
    return testContext;
  }

  if (USE_EXISTING_DB) {
    return setupExistingDatabase();
  }

  return setupContainerDatabase();
}

/**
 * Connect to existing docker-compose database
 */
async function setupExistingDatabase(): Promise<TestDatabaseContext> {
  const sqlConfig = {
    user: "sa",
    password: EXISTING_DB_PASSWORD,
    database: "master",
    server: EXISTING_DB_HOST,
    port: EXISTING_DB_PORT,
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  // Create the test database if it doesn't exist
  const masterAdapter = new PrismaMssql(sqlConfig);
  const masterPrisma = new PrismaClient({ adapter: masterAdapter });

  await masterPrisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${TEST_DATABASE}')
    BEGIN
      CREATE DATABASE [${TEST_DATABASE}]
    END
  `);

  await masterPrisma.$disconnect();

  // Override environment variables so the app's Prisma uses test database
  process.env.DB_HOST = EXISTING_DB_HOST;
  process.env.DB_PORT = String(EXISTING_DB_PORT);
  process.env.DB_USER = "sa";
  process.env.DB_PASSWORD = EXISTING_DB_PASSWORD;
  process.env.DB_NAME = TEST_DATABASE;

  // Connect to the test database
  const testSqlConfig = {
    ...sqlConfig,
    database: TEST_DATABASE,
  };

  const testAdapter = new PrismaMssql(testSqlConfig);
  const prisma = new PrismaClient({ adapter: testAdapter });

  // Create the transactions table based on schema
  await createSchema(prisma);

  testContext = { prisma, container: null };
  return testContext;
}

/**
 * Spin up an ephemeral MSSQL container for tests
 */
async function setupContainerDatabase(): Promise<TestDatabaseContext> {
  // Start MSSQL container on a random available port
  const container = await new GenericContainer(
    "mcr.microsoft.com/mssql/server:2025-latest"
  )
    .withEnvironment({
      ACCEPT_EULA: "Y",
      MSSQL_SA_PASSWORD: CONTAINER_SA_PASSWORD,
    })
    .withExposedPorts(1433)
    .withWaitStrategy(Wait.forLogMessage(/Recovery is complete/i))
    .withStartupTimeout(120000)
    .start();

  const port = container.getMappedPort(1433);
  const host = container.getHost();

  // Wait a bit for SQL Server to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Create adapter config for test database
  const sqlConfig = {
    user: "sa",
    password: CONTAINER_SA_PASSWORD,
    database: "master",
    server: host,
    port: port,
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  // Create the test database using master connection
  const masterAdapter = new PrismaMssql(sqlConfig);
  const masterPrisma = new PrismaClient({ adapter: masterAdapter });

  await masterPrisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${TEST_DATABASE}')
    BEGIN
      CREATE DATABASE [${TEST_DATABASE}]
    END
  `);

  await masterPrisma.$disconnect();

  // Connect to the test database
  const testSqlConfig = {
    ...sqlConfig,
    database: TEST_DATABASE,
  };

  const testAdapter = new PrismaMssql(testSqlConfig);
  const prisma = new PrismaClient({ adapter: testAdapter });

  // Create the transactions table
  await createSchema(prisma);

  testContext = { prisma, container };
  return testContext;
}

/**
 * Creates the transactions table and indexes
 */
async function createSchema(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'transactions')
    BEGIN
      CREATE TABLE [transactions] (
        [transaction_id] VARCHAR(50) NOT NULL PRIMARY KEY,
        [transaction_date] DATE NOT NULL,
        [transaction_time] TIME NOT NULL,
        [account_id] VARCHAR(50) NOT NULL,
        [account_name] VARCHAR(100) NOT NULL,
        [account_type] VARCHAR(50) NOT NULL,
        [account_owner] VARCHAR(50) NOT NULL,
        [description] VARCHAR(500) NULL,
        [category] VARCHAR(100) NULL,
        [subcategory] VARCHAR(100) NULL,
        [amount] DECIMAL(18, 2) NOT NULL,
        [transaction_type] VARCHAR(50) NOT NULL,
        [balance_after] DECIMAL(18, 2) NULL,
        [is_recurring] BIT NULL,
        [recurring_frequency] VARCHAR(50) NULL,
        [notes] VARCHAR(1000) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
      )
    END
  `);

  // Create indexes
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transactions_account')
      CREATE INDEX IX_transactions_account ON [transactions]([account_id]);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transactions_category')
      CREATE INDEX IX_transactions_category ON [transactions]([category], [subcategory]);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transactions_date')
      CREATE INDEX IX_transactions_date ON [transactions]([transaction_date] DESC);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_transactions_type')
      CREATE INDEX IX_transactions_type ON [transactions]([transaction_type]);
  `);
}

/**
 * Tears down the test database container and closes connections.
 * Should be called in afterAll() hook.
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testContext) {
    await testContext.prisma.$disconnect();
    if (testContext.container) {
      await testContext.container.stop();
    }
    testContext = null;
  }
}

/**
 * Clears all data from the transactions table.
 * Call this between tests to ensure isolation.
 */
export async function clearTestData(): Promise<void> {
  if (testContext) {
    await testContext.prisma.$executeRawUnsafe(
      "DELETE FROM [transactions]"
    );
  }
  // Reset in-memory pattern state for recurring detection tests
  // Dynamic import to avoid loading lib/db before env vars are set
  try {
    const { resetPatternState } = await import("@/lib/queries/recurring");
    resetPatternState();
  } catch {
    // Module not yet loaded, nothing to reset
  }
}

/**
 * Seeds the test database with sample transactions.
 *
 * @param count Number of sample transactions to create
 */
export async function seedTestData(count = 10): Promise<void> {
  if (!testContext) {
    throw new Error("Test database not initialized. Call setupTestDatabase first.");
  }

  const accounts = [
    { id: "ACC001", name: "Checking Account", type: "Checking", owner: "Test User" },
    { id: "ACC002", name: "Savings Account", type: "Savings", owner: "Test User" },
    { id: "ACC003", name: "Credit Card", type: "Credit", owner: "Test User" },
  ];

  const categories = ["Groceries", "Utilities", "Entertainment", "Income", "Transfer"];
  const types = ["Debit", "Credit", "Transfer"];

  for (let i = 0; i < count; i++) {
    const account = accounts[i % accounts.length];
    const category = categories[i % categories.length];
    const type = types[i % types.length];
    const amount = type === "Credit" ? Math.random() * 1000 + 100 : -(Math.random() * 200 + 10);
    const date = new Date();
    date.setDate(date.getDate() - i);

    await testContext.prisma.$executeRawUnsafe(`
      INSERT INTO [transactions] (
        transaction_id, transaction_date, transaction_time, account_id, account_name,
        account_type, account_owner, description, category, subcategory, amount,
        transaction_type, balance_after, is_recurring, recurring_frequency, notes
      ) VALUES (
        '${`TXN${String(i + 1).padStart(6, "0")}`}',
        '${date.toISOString().split("T")[0]}',
        '${date.toTimeString().split(" ")[0]}',
        '${account.id}',
        '${account.name}',
        '${account.type}',
        '${account.owner}',
        'Test transaction ${i + 1}',
        '${category}',
        NULL,
        ${amount.toFixed(2)},
        '${type}',
        ${(1000 + amount).toFixed(2)},
        ${i % 3 === 0 ? 1 : 0},
        ${i % 3 === 0 ? "'Monthly'" : "NULL"},
        'Seeded for testing'
      )
    `);
  }
}

/**
 * Gets the Prisma client for the test database.
 * Throws if setupTestDatabase hasn't been called.
 */
export function getTestPrisma(): PrismaClient {
  if (!testContext) {
    throw new Error("Test database not initialized. Call setupTestDatabase first.");
  }
  return testContext.prisma;
}
