PRAGMA foreign_keys=OFF;

ALTER TABLE `music_groups` RENAME TO `bands`;

CREATE TABLE `__new_bands_members` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`band_id` integer NOT NULL,
	`is_admin` integer NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `__new_bands_members`(`id`, `user_id`, `band_id`, `is_admin`, `joined_at`)
SELECT `id`, `user_id`, `music_group_id`, `is_admin`, `joined_at` FROM `music_groups_members`;

DROP TABLE `music_groups_members`;
ALTER TABLE `__new_bands_members` RENAME TO `bands_members`;

CREATE TABLE `__new_bands_followers` (
	`id` integer PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`band_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE no action
);

INSERT INTO `__new_bands_followers`(`id`, `follower_id`, `band_id`, `created_at`)
SELECT `id`, `follower_id`, `music_group_id`, `created_at` FROM `music_groups_followers`;

DROP TABLE `music_groups_followers`;
ALTER TABLE `__new_bands_followers` RENAME TO `bands_followers`;

PRAGMA foreign_keys=ON;

DROP INDEX IF EXISTS `idx_music_groups_primary_genre`;
DROP INDEX IF EXISTS `idx_music_groups_location`;
DROP INDEX IF EXISTS `idx_music_groups_city`;
DROP INDEX IF EXISTS `idx_music_groups_members_user_bands`;

CREATE INDEX `idx_bands_primary_genre` ON `bands` (`primary_genre`);
CREATE INDEX `idx_bands_location` ON `bands` (`latitude`,`longitude`);
CREATE INDEX `idx_bands_city` ON `bands` (`city`);
CREATE INDEX `idx_bands_members_user_bands` ON `bands_members` (`user_id`,`is_admin`,`joined_at`);
