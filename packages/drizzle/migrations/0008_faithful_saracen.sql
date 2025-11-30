-- Add username column as nullable first
ALTER TABLE `bands` ADD `username` text;--> statement-breakpoint
-- Create case-insensitive unique index for username lookups
CREATE INDEX `idx_bands_username_lower` ON `bands` (LOWER("username"));