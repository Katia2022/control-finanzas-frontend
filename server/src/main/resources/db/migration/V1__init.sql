-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Savings Plans
CREATE TYPE savings_plan_type AS ENUM ('FIXED', 'PERCENT');
CREATE TYPE savings_plan_status AS ENUM ('ACTIVE', 'PAUSED');

CREATE TABLE IF NOT EXISTS savings_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    month_key CHAR(7) NOT NULL,
    type savings_plan_type NOT NULL,
    amount_planned NUMERIC(14,2) NOT NULL DEFAULT 0,
    percent NUMERIC(6,4),
    priority INT NOT NULL DEFAULT 1,
    status savings_plan_status NOT NULL DEFAULT 'ACTIVE',
    source_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    target_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL
);

-- Savings Moves
CREATE TYPE savings_move_status AS ENUM ('PENDING', 'DONE', 'FAILED');

CREATE TABLE IF NOT EXISTS savings_moves (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES savings_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    status savings_move_status NOT NULL DEFAULT 'PENDING',
    note VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_savings_plans_month ON savings_plans(month_key);
CREATE INDEX IF NOT EXISTS idx_savings_moves_date ON savings_moves(date);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Budget per category per month
CREATE TABLE IF NOT EXISTS budget_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_key CHAR(7) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    CONSTRAINT uk_budget_cat_month UNIQUE (category_id, month_key)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value_json TEXT
);
