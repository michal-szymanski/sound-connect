CREATE TABLE `comments_reactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`comment_id` integer NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`postId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY NOT NULL,
	`postId` integer NOT NULL,
	`type` text,
	`url` text NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `music_groups_members` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`musicGroupId` integer NOT NULL,
	`isAdmin` integer,
	FOREIGN KEY (`musicGroupId`) REFERENCES `music_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `music_groups_followers` (
	`id` integer PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`musicGroupId` integer NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`musicGroupId`) REFERENCES `music_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `music_groups` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE TABLE `posts_reactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`postId` integer NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE TABLE `users_followers` (
	`id` integer PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`user_id` text NOT NULL,
	`createdAt` text NOT NULL
);
