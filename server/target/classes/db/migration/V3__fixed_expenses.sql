-- Fixed expenses for auto-fill and planning
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_category ON fixed_expenses(category_id);

