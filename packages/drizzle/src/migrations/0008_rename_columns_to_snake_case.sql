-- Rename columns in posts table to snake_case
ALTER TABLE posts RENAME COLUMN createdAt TO created_at;
ALTER TABLE posts RENAME COLUMN updatedAt TO updated_at;

-- Rename columns in media table to snake_case
ALTER TABLE media RENAME COLUMN postId TO post_id;

-- Rename columns in posts_reactions table to snake_case
ALTER TABLE posts_reactions RENAME COLUMN postId TO post_id;
ALTER TABLE posts_reactions RENAME COLUMN createdAt TO created_at;

-- Rename columns in comments table to snake_case
ALTER TABLE comments RENAME COLUMN postId TO post_id;
ALTER TABLE comments RENAME COLUMN createdAt TO created_at;
ALTER TABLE comments RENAME COLUMN updatedAt TO updated_at;

-- Rename columns in comments_reactions table to snake_case
ALTER TABLE comments_reactions RENAME COLUMN createdAt TO created_at;
