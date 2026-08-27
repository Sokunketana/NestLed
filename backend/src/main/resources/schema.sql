-- Existing installations created this column as NOT NULL. New installations get
-- the nullable definition directly from the Item entity.
ALTER TABLE IF EXISTS items
    ALTER COLUMN estimated_value DROP NOT NULL;
