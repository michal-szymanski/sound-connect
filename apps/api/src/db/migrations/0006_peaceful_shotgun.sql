ALTER TABLE `posts` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `moderation_reason` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `moderated_at` text;