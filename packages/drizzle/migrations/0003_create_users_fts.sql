-- Create FTS5 virtual table for user search
CREATE VIRTUAL TABLE users_fts USING fts5(name, content=users, content_rowid=rowid);

-- Populate FTS table with existing users
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;

-- Create triggers to keep FTS table in sync
CREATE TRIGGER users_ai AFTER INSERT ON users BEGIN
  INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name);
END;

CREATE TRIGGER users_ad AFTER DELETE ON users BEGIN
  INSERT INTO users_fts(users_fts, rowid, name) VALUES('delete', old.rowid, old.name);
END;

CREATE TRIGGER users_au AFTER UPDATE ON users BEGIN
  INSERT INTO users_fts(users_fts, rowid, name) VALUES('delete', old.rowid, old.name);
  INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name);
END;
