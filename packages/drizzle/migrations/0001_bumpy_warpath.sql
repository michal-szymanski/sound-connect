CREATE VIRTUAL TABLE users_fts USING fts5(name, content='users', content_rowid='rowid');
--> statement-breakpoint
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;

-- Trigger to sync INSERT operations
CREATE TRIGGER users_fts_insert AFTER INSERT ON users BEGIN
  INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name);
END;
--> statement-breakpoint

-- Trigger to sync UPDATE operations
CREATE TRIGGER users_fts_update AFTER UPDATE ON users BEGIN
  UPDATE users_fts SET name = new.name WHERE rowid = old.rowid;
END;
--> statement-breakpoint

-- Trigger to sync DELETE operations
CREATE TRIGGER users_fts_delete AFTER DELETE ON users BEGIN
  DELETE FROM users_fts WHERE rowid = old.rowid;
END;
