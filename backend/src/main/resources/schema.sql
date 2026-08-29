-- Existing installations created this column as NOT NULL. New installations get
-- the nullable definition directly from the Item entity.
ALTER TABLE IF EXISTS items
    ALTER COLUMN estimated_value DROP NOT NULL^^^

-- Seed optimistic-lock versions for installations created before versioning was added.
ALTER TABLE IF EXISTS items
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0^^^

-- Older versions allowed an item to belong directly to a room. Preserve those
-- records by moving them into one clearly marked location per room before the
-- relationship becomes mandatory. New databases are created with NOT NULL by JPA.
DO $$
DECLARE
    affected_room_id BIGINT;
    migrated_location_id BIGINT;
BEGIN
    IF to_regclass('public.items') IS NOT NULL
       AND to_regclass('public.storage_locations') IS NOT NULL THEN
        FOR affected_room_id IN
            SELECT DISTINCT room_id FROM items WHERE storage_location_id IS NULL
        LOOP
            INSERT INTO storage_locations (name, description, room_id)
            VALUES ('Migrated items', 'Created automatically when storage locations became required.', affected_room_id)
            RETURNING id INTO migrated_location_id;

            UPDATE items
            SET storage_location_id = migrated_location_id
            WHERE room_id = affected_room_id AND storage_location_id IS NULL;
        END LOOP;

        ALTER TABLE items ALTER COLUMN storage_location_id SET NOT NULL;
    END IF;
END $$^^^
