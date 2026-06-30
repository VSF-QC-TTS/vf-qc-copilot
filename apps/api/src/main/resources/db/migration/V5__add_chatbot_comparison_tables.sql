-- V5: Add Chatbot Comparison feature tables and columns

-- 1. Add type and name to ai_configs
ALTER TABLE ai_configs ADD COLUMN type VARCHAR(30) DEFAULT 'JUDGE' NOT NULL;
ALTER TABLE ai_configs ADD COLUMN name VARCHAR(255);

-- 2. Drop unique project_id constraint
ALTER TABLE ai_configs DROP CONSTRAINT IF EXISTS uk_ai_configs_project;

-- 3. Add new unique constraints
-- Only 1 JUDGE per project
CREATE UNIQUE INDEX uk_ai_configs_judge_project ON ai_configs (project_id) WHERE type = 'JUDGE';

-- COMPARE configs must have unique names per project
CREATE UNIQUE INDEX uk_ai_configs_compare_name ON ai_configs (project_id, name) WHERE type = 'COMPARE';

-- 4. Update test_runs table
ALTER TABLE test_runs ADD COLUMN run_type VARCHAR(30) DEFAULT 'EVALUATION' NOT NULL;
ALTER TABLE test_runs ADD COLUMN compare_ai_configs JSONB;
