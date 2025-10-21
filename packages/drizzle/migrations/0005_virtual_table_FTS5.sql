-- 1) Create the FTS5 table, linking its rowid to users.rowid
CREATE VIRTUAL TABLE users_fts
  USING fts5(
    name,
    content='users',
    content_rowid='rowid'
  );

-- 2) Populate it from the existing users table
INSERT INTO users_fts(rowid, name)
  SELECT rowid, name FROM users;

-- 3a) After INSERT on users, add to FTS
CREATE TRIGGER users_ai
AFTER INSERT ON users
BEGIN
  INSERT INTO users_fts(rowid, name)
    VALUES (new.rowid, new.name);
END;

-- 3b) After DELETE on users, delete from FTS
CREATE TRIGGER users_ad
AFTER DELETE ON users
BEGIN
  INSERT INTO users_fts(users_fts, rowid)
    VALUES('delete', old.rowid);
END;

-- 3c) After UPDATE on users, delete old and insert new
CREATE TRIGGER users_au
AFTER UPDATE ON users
BEGIN
  -- remove old
  INSERT INTO users_fts(users_fts, rowid)
    VALUES('delete', old.rowid);
  -- add updated
  INSERT INTO users_fts(rowid, name)
    VALUES(new.rowid, new.name);
END;