CREATE VIRTUAL TABLE users_fts USING fts5(name, content='users', content_rowid='rowid');
--> statement-breakpoint
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;
