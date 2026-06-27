-- =============================================================
-- V4: Rename judge_configs → ai_configs, evolve schema
-- =============================================================

-- Rename table
ALTER TABLE judge_configs RENAME TO ai_configs;

-- Rename constraints
ALTER TABLE ai_configs RENAME CONSTRAINT uk_judge_configs_public_id TO uk_ai_configs_public_id;
ALTER TABLE ai_configs RENAME CONSTRAINT uk_judge_configs_project TO uk_ai_configs_project;
ALTER TABLE ai_configs RENAME CONSTRAINT fk_judge_configs_project TO fk_ai_configs_project;

-- Rename index
ALTER INDEX idx_judge_configs_project RENAME TO idx_ai_configs_project;

-- Rename 'model' → 'evaluation_model'
ALTER TABLE ai_configs RENAME COLUMN model TO evaluation_model;

-- Add new columns
ALTER TABLE ai_configs ADD COLUMN key_source VARCHAR(20) NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE ai_configs ADD COLUMN generation_model VARCHAR(255);

-- Drop custom_model_name (merged into model string)
ALTER TABLE ai_configs DROP COLUMN IF EXISTS custom_model_name;
