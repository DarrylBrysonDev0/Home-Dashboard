-- Initialize HomeFinance-db database
CREATE DATABASE [HomeFinance-db];
GO

USE [HomeFinance-db];
GO

-- Create transactions table based on CSV structure
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
GO

-- Create indexes for common queries
CREATE INDEX IX_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IX_transactions_account ON transactions(account_id);
CREATE INDEX IX_transactions_category ON transactions(category, subcategory);
CREATE INDEX IX_transactions_type ON transactions(transaction_type);
GO

-- Create view for expense summary
CREATE VIEW vw_expense_summary AS
SELECT 
    account_id,
    account_name,
    category,
    subcategory,
    transaction_type,
    YEAR(transaction_date) AS year,
    MONTH(transaction_date) AS month,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount
FROM transactions
GROUP BY 
    account_id,
    account_name,
    category,
    subcategory,
    transaction_type,
    YEAR(transaction_date),
    MONTH(transaction_date);
GO

PRINT 'HomeFinance-db database initialized successfully';
