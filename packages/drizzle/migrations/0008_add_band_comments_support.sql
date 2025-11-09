-- Add authorType and bandId to comments table for band comments support
ALTER TABLE `comments` ADD `author_type` text DEFAULT 'user' NOT NULL;
ALTER TABLE `comments` ADD `band_id` integer REFERENCES bands(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX `idx_comments_author_type` ON `comments` (`author_type`);
CREATE INDEX `idx_comments_band_id` ON `comments` (`band_id`);
