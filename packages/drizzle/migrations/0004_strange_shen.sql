CREATE TABLE `geocoding_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`city` text NOT NULL,
	`state` text,
	`country` text,
	`latitude` integer NOT NULL,
	`longitude` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_geocoding_cache_location` ON `geocoding_cache` (`city`,`state`,`country`);--> statement-breakpoint
CREATE INDEX `idx_geocoding_cache_created_at` ON `geocoding_cache` (`created_at`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `latitude` integer;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `longitude` integer;--> statement-breakpoint
CREATE INDEX `idx_user_profiles_location` ON `user_profiles` (`latitude`,`longitude`);