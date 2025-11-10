CREATE TABLE `band_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`band_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`position` text,
	`music_link` text,
	`status` text NOT NULL,
	`feedback_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_band_applications_band_id` ON `band_applications` (`band_id`,`status`,`created_at`);
CREATE INDEX `idx_band_applications_user_id` ON `band_applications` (`user_id`,`status`);
CREATE INDEX `idx_band_applications_status` ON `band_applications` (`status`);
