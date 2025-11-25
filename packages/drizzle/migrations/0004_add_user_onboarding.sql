CREATE TABLE `user_onboarding` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`current_step` integer DEFAULT 1 NOT NULL,
	`completed_at` integer,
	`skipped_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_onboarding_user_id_unique` ON `user_onboarding` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_onboarding_user_id` ON `user_onboarding` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_onboarding_completed_at` ON `user_onboarding` (`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_user_onboarding_skipped_at` ON `user_onboarding` (`skipped_at`);