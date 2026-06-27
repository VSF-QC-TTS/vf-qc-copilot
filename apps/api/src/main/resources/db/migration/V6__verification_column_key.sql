-- =============================================================
-- V6: Add expected_column_key (UUID) to field_checks
-- =============================================================

-- Add new UUID column for stable column reference
ALTER TABLE field_checks ADD COLUMN expected_column_key UUID;

-- Migrate existing data: map expected_column (name) → dataset_columns.public_id
UPDATE field_checks fc
SET expected_column_key = (
  SELECT dc.public_id
  FROM dataset_columns dc
  JOIN project_schemas ps ON dc.schema_version_id = ps.id
  JOIN verification_configs vc ON vc.project_id = ps.project_id
  WHERE vc.id = fc.verification_config_id
    AND dc.column_name = fc.expected_column
  ORDER BY ps.version DESC
  LIMIT 1
)
WHERE fc.expected_column IS NOT NULL;

-- Drop old string column
ALTER TABLE field_checks DROP COLUMN IF EXISTS expected_column;
