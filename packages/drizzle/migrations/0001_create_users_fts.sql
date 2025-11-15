-- Migration: Create full-text search for users
-- Created: 2025-11-15
-- Purpose: Enable fast user search by name

CREATE VIRTUAL TABLE users_fts USING fts5(name, content='users', content_rowid='rowid');
--> statement-breakpoint
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;
