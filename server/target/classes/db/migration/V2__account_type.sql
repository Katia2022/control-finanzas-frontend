-- Add account type to classify accounts for savings rules
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'OPERATIVA';

