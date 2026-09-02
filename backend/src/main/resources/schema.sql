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

-- Preserve the previous one-household-per-user assignments as memberships. The
-- app_users household columns now identify only the household currently selected.
INSERT INTO household_memberships (household_id, app_user_id, role, joined_at)
SELECT household_id, id, COALESCE(household_role, 'MEMBER'), COALESCE(created_at, CURRENT_TIMESTAMP)
FROM app_users
WHERE household_id IS NOT NULL
ON CONFLICT (household_id, app_user_id) DO NOTHING^^^

-- Assign legacy inventory data to the original shared household. New records are
-- always written with the active household by the application services.
DO $$
DECLARE
    legacy_household_id BIGINT;
BEGIN
    SELECT id INTO legacy_household_id FROM households ORDER BY id LIMIT 1;

    IF legacy_household_id IS NOT NULL THEN
        UPDATE rooms SET household_id = legacy_household_id WHERE household_id IS NULL;
        UPDATE categories SET household_id = legacy_household_id WHERE household_id IS NULL;
        UPDATE storage_locations location
        SET household_id = room.household_id
        FROM rooms room
        WHERE location.room_id = room.id AND location.household_id IS NULL;
        UPDATE items item
        SET household_id = room.household_id
        FROM rooms room
        WHERE item.room_id = room.id AND item.household_id IS NULL;
    END IF;
END $$^^^

-- Room and category names only need to be unique inside one household. Remove
-- single-column constraints created by older versions, then enforce case-insensitive
-- uniqueness per household.
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE contype = 'u'
          AND conrelid IN ('rooms'::regclass, 'categories'::regclass)
          AND pg_get_constraintdef(oid) = 'UNIQUE (name)'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
                       constraint_record.table_name, constraint_record.conname);
    END LOOP;
END $$^^^

CREATE UNIQUE INDEX IF NOT EXISTS uk_rooms_household_name_ci
    ON rooms (household_id, lower(name))^^^

CREATE UNIQUE INDEX IF NOT EXISTS uk_categories_household_name_ci
    ON categories (household_id, lower(name))^^^

CREATE UNIQUE INDEX IF NOT EXISTS uk_household_invitation_email_ci
    ON household_invitations (household_id, lower(email))^^^

CREATE INDEX IF NOT EXISTS ix_rooms_household ON rooms (household_id)^^^
CREATE INDEX IF NOT EXISTS ix_categories_household ON categories (household_id)^^^
CREATE INDEX IF NOT EXISTS ix_storage_locations_household ON storage_locations (household_id)^^^
CREATE INDEX IF NOT EXISTS ix_items_household ON items (household_id)^^^

ALTER TABLE rooms ALTER COLUMN household_id SET NOT NULL^^^
ALTER TABLE categories ALTER COLUMN household_id SET NOT NULL^^^
ALTER TABLE storage_locations ALTER COLUMN household_id SET NOT NULL^^^
ALTER TABLE items ALTER COLUMN household_id SET NOT NULL^^^

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
            INSERT INTO storage_locations (name, description, room_id, household_id)
            VALUES ('Migrated items', 'Created automatically when storage locations became required.',
                    affected_room_id, (SELECT household_id FROM rooms WHERE id = affected_room_id))
            RETURNING id INTO migrated_location_id;

            UPDATE items
            SET storage_location_id = migrated_location_id
            WHERE room_id = affected_room_id AND storage_location_id IS NULL;
        END LOOP;

        ALTER TABLE items ALTER COLUMN storage_location_id SET NOT NULL;
    END IF;
END $$^^^
