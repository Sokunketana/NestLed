-- Existing installations created this column as NOT NULL. New installations get
-- the nullable definition directly from the Item entity.
ALTER TABLE IF EXISTS items
    ALTER COLUMN estimated_value DROP NOT NULL^^^

-- Seed optimistic-lock versions for installations created before versioning was added.
ALTER TABLE IF EXISTS items
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0^^^

-- Put accounts from pre-household installations into the one shared household.
DO $$
DECLARE
    shared_household_id BIGINT;
    owner_user_id BIGINT;
BEGIN
    IF to_regclass('public.app_users') IS NOT NULL
       AND to_regclass('public.households') IS NOT NULL THEN
        SELECT id INTO shared_household_id FROM households ORDER BY id LIMIT 1;
        IF shared_household_id IS NULL AND EXISTS (SELECT 1 FROM app_users) THEN
            INSERT INTO households (name) VALUES ('My household') RETURNING id INTO shared_household_id;
        END IF;

        -- Run the legacy backfill only before any account has been assigned. This
        -- keeps intentionally removed members removed on later application starts.
        IF shared_household_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM app_users WHERE household_id IS NOT NULL) THEN
            SELECT id INTO owner_user_id
            FROM app_users
            WHERE household_role = 'OWNER'
            ORDER BY id LIMIT 1;

            IF owner_user_id IS NULL THEN
                SELECT id INTO owner_user_id FROM app_users ORDER BY created_at, id LIMIT 1;
            END IF;

            UPDATE app_users
            SET household_id = shared_household_id,
                household_role = CASE WHEN id = owner_user_id THEN 'OWNER' ELSE 'MEMBER' END
            WHERE household_id IS NULL;
        END IF;
    END IF;
END $$^^^

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
