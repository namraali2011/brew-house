BEGIN;

CREATE TABLE menu_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) <= 50)
);
CREATE UNIQUE INDEX menu_categories_name_lower_key ON menu_categories (lower(name));

-- Keep a deterministic existing spelling if historical data contains case variants.
INSERT INTO menu_categories (name)
SELECT DISTINCT ON (lower(category)) category
FROM menu_items
ORDER BY lower(category), id;

INSERT INTO menu_categories (name)
VALUES ('Coffee'), ('Dessert'), ('Snacks') ON CONFLICT DO NOTHING;

ALTER TABLE menu_items
    ADD COLUMN category_id INTEGER REFERENCES menu_categories(id) ON DELETE RESTRICT,
    ADD COLUMN available BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN image_url TEXT CHECK (char_length(image_url) <= 2048);

UPDATE menu_items AS item SET category_id = category.id
FROM menu_categories AS category WHERE lower(item.category) = lower(category.name);

ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE menu_items DROP COLUMN category;
CREATE INDEX menu_items_category_id_idx ON menu_items (category_id);

CREATE TABLE booking_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 5 AND 240)
);
INSERT INTO booking_settings DEFAULT VALUES;

COMMIT;
