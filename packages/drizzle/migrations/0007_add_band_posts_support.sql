PRAGMA foreign_keys=OFF;--> statement-breakpoint

ALTER TABLE `posts` ADD `author_type` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `band_id` integer REFERENCES `bands`(`id`) ON DELETE CASCADE;--> statement-breakpoint

CREATE INDEX `idx_posts_author_type` ON `posts` (`author_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_posts_band_id` ON `posts` (`band_id`);--> statement-breakpoint

CREATE TABLE `__new_bands_followers` (
	`id` integer PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`band_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint

INSERT INTO `__new_bands_followers`("id", "follower_id", "band_id", "created_at") SELECT "id", "follower_id", "band_id", "created_at" FROM `bands_followers`;--> statement-breakpoint
DROP TABLE `bands_followers`;--> statement-breakpoint
ALTER TABLE `__new_bands_followers` RENAME TO `bands_followers`;--> statement-breakpoint

CREATE INDEX `idx_bands_followers_band_id` ON `bands_followers` (`band_id`);--> statement-breakpoint
CREATE INDEX `idx_bands_followers_follower_band` ON `bands_followers` (`follower_id`,`band_id`);--> statement-breakpoint

PRAGMA foreign_keys=ON;
