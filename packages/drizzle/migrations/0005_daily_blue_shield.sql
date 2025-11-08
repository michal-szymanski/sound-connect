PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_music_groups_members` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`music_group_id` integer NOT NULL,
	`is_admin` integer NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`music_group_id`) REFERENCES `music_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_music_groups_members`("id", "user_id", "music_group_id", "is_admin", "joined_at") SELECT "id", "user_id", "music_group_id", "is_admin", COALESCE("joined_at", datetime('now')) FROM `music_groups_members`;--> statement-breakpoint
DROP TABLE `music_groups_members`;--> statement-breakpoint
ALTER TABLE `__new_music_groups_members` RENAME TO `music_groups_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_music_groups_members_user_bands` ON `music_groups_members` (`user_id`,`is_admin`,`joined_at`);--> statement-breakpoint
ALTER TABLE `music_groups` ADD `description` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `primary_genre` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `city` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `state` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `country` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `latitude` integer;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `longitude` integer;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `looking_for` text;--> statement-breakpoint
ALTER TABLE `music_groups` ADD `profile_image_url` text;--> statement-breakpoint
CREATE INDEX `idx_music_groups_primary_genre` ON `music_groups` (`primary_genre`);--> statement-breakpoint
CREATE INDEX `idx_music_groups_location` ON `music_groups` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `idx_music_groups_city` ON `music_groups` (`city`);