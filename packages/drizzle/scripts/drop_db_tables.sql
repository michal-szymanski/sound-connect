-- Drop all tables from Sound Connect D1 database
-- WARNING: This will permanently delete ALL data and tables!

DROP TABLE IF EXISTS discovery_analytics;
DROP TABLE IF EXISTS band_applications;
DROP TABLE IF EXISTS upload_sessions;
DROP TABLE IF EXISTS geocoding_cache;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS comments_reactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts_reactions;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bands_followers;
DROP TABLE IF EXISTS bands_members;
DROP TABLE IF EXISTS bands;
DROP TABLE IF EXISTS user_additional_instruments;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS users_followers;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS jwkss;
DROP TABLE IF EXISTS verifications;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS users_fts;
DROP TABLE IF EXISTS d1_migrations;
DELETE FROM sqlite_sequence;
