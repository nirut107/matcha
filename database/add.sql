ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE pictures ADD COLUMN position INT;
ALTER TABLE pictures
ADD CONSTRAINT unique_user_position UNIQUE (user_id, position);
