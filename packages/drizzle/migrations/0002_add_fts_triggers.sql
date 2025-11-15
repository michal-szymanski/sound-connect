-- Migration: Add triggers to sync FTS table with users table
-- Created: 2025-11-15
-- Purpose: Keep users_fts in sync with users table automatically

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
