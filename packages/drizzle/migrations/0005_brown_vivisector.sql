CREATE TABLE `music_samples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`instrument` text,
	`media_type` text NOT NULL,
	`r2_key` text NOT NULL,
	`duration_seconds` integer,
	`file_size` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_music_samples_user_id` ON `music_samples` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_music_samples_user_sort` ON `music_samples` (`user_id`,`sort_order`);