-- =============================================================
-- V5: Simplify dataset_columns + rename schema version table
-- =============================================================

-- Rename dataset_schema_versions → project_schemas
ALTER TABLE dataset_schema_versions RENAME TO project_schemas;

-- Rename constraints
ALTER TABLE project_schemas RENAME CONSTRAINT uk_schema_versions_public_id TO uk_project_schemas_public_id;
ALTER TABLE project_schemas RENAME CONSTRAINT fk_schema_versions_project TO fk_project_schemas_project;

-- Rename index
ALTER INDEX idx_schema_versions_project RENAME TO idx_project_schemas_project;

-- Update FK in dataset_columns to point to renamed table (FK target auto-follows rename)
-- Simplify dataset_columns: drop unused fields
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS display_name;
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS data_type;
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS role;
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS required;
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS sample_value;
