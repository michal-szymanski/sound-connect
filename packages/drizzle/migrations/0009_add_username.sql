ALTER TABLE users ADD COLUMN username text;
--> statement-breakpoint
CREATE UNIQUE INDEX idx_users_username_lower ON users(LOWER(username)) WHERE username IS NOT NULL;
--> statement-breakpoint
CREATE INDEX idx_users_username_lookup ON users(username) WHERE username IS NOT NULL;
