-- Rename dataset_schema_versions → project_schemas
ALTER TABLE dataset_schema_versions RENAME TO project_schemas;

-- Rename constraints
ALTER TABLE project_schemas RENAME CONSTRAINT uk_schema_versions_public_id TO uk_project_schemas_public_id;
ALTER TABLE project_schemas RENAME CONSTRAINT fk_schema_versions_project TO fk_project_schemas_project;

-- Rename index
ALTER INDEX idx_schema_versions_project RENAME TO idx_project_schemas_project;

-- Ensure updated_at exists for ProjectSchema entity
ALTER TABLE project_schemas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Simplify dataset_columns: drop unused fields
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS display_name;
ALTER TABLE dataset_columns DROP COLUMN IF EXISTS required;