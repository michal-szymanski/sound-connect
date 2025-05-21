PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users_followers` (
	`id` integer PRIMARY KEY NOT NULL,
	`followed_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`followed_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_users_followers`("id", "followed_user_id", "user_id", "createdAt") SELECT "id", "followed_user_id", "user_id", "createdAt" FROM `users_followers`;--> statement-breakpoint
DROP TABLE `users_followers`;--> statement-breakpoint
ALTER TABLE `__new_users_followers` RENAME TO `users_followers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;