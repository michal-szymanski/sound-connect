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
--> statement-breakpoint
CREATE INDEX `idx_band_applications_band_id` ON `band_applications` (`band_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_band_applications_user_id` ON `band_applications` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_band_applications_status` ON `band_applications` (`status`);--> statement-breakpoint
CREATE TABLE `bands_followers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`follower_id` text NOT NULL,
	`band_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bands_followers_band_id` ON `bands_followers` (`band_id`);--> statement-breakpoint
CREATE INDEX `idx_bands_followers_follower_band` ON `bands_followers` (`follower_id`,`band_id`);--> statement-breakpoint
CREATE TABLE `bands_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`band_id` integer NOT NULL,
	`is_admin` integer NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bands_members_user_bands` ON `bands_members` (`user_id`,`is_admin`,`joined_at`);--> statement-breakpoint
CREATE TABLE `bands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`primary_genre` text,
	`city` text,
	`state` text,
	`country` text,
	`latitude` integer,
	`longitude` integer,
	`looking_for` text,
	`profile_image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_bands_primary_genre` ON `bands` (`primary_genre`);--> statement-breakpoint
CREATE INDEX `idx_bands_location` ON `bands` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `idx_bands_city` ON `bands` (`city`);--> statement-breakpoint
CREATE TABLE `blocked_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`blocked_at` text NOT NULL,
	FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_blocked_users_blocker` ON `blocked_users` (`blocker_id`);--> statement-breakpoint
CREATE INDEX `idx_blocked_users_blocked` ON `blocked_users` (`blocked_id`);--> statement-breakpoint
CREATE INDEX `idx_blocked_users_blocker_blocked` ON `blocked_users` (`blocker_id`,`blocked_id`);--> statement-breakpoint
CREATE TABLE `chat_room_participants` (
	`chat_room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`chat_room_id`, `user_id`),
	FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_room_participants_user` ON `chat_room_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`comment_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_type` text DEFAULT 'user' NOT NULL,
	`user_id` text NOT NULL,
	`band_id` integer,
	`post_id` integer NOT NULL,
	`parent_comment_id` integer,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comments_author_type` ON `comments` (`author_type`);--> statement-breakpoint
CREATE INDEX `idx_comments_band_id` ON `comments` (`band_id`);--> statement-breakpoint
CREATE TABLE `discovery_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`event_type` text NOT NULL,
	`band_id` integer,
	`match_score` integer,
	`match_factors` text,
	`position_in_feed` integer,
	`page_number` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_user_id` ON `discovery_analytics` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_event_type` ON `discovery_analytics` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_band_id` ON `discovery_analytics` (`band_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_created_at` ON `discovery_analytics` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_session_id` ON `discovery_analytics` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_user_event` ON `discovery_analytics` (`user_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_band_event` ON `discovery_analytics` (`band_id`,`event_type`);--> statement-breakpoint
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
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`type` text NOT NULL,
	`key` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_room_id` text NOT NULL,
	`sender_id` text,
	`message_type` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_messages_room_time` ON `messages` (`chat_room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_id` text NOT NULL,
	`entity_id` text,
	`entity_type` text,
	`content` text NOT NULL,
	`seen` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`post_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_type` text DEFAULT 'user' NOT NULL,
	`user_id` text NOT NULL,
	`band_id` integer,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`moderation_reason` text,
	`moderated_at` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_posts_author_type` ON `posts` (`author_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_posts_band_id` ON `posts` (`band_id`);--> statement-breakpoint
CREATE TABLE `upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`upload_type` text NOT NULL,
	`band_id` integer,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`temp_key` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`confirmed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_upload_sessions_user_id` ON `upload_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_upload_sessions_expires_at` ON `upload_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_upload_sessions_confirmed_at` ON `upload_sessions` (`confirmed_at`);--> statement-breakpoint
CREATE TABLE `user_additional_instruments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`instrument` text NOT NULL,
	`years` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_additional_instruments_user_id` ON `user_additional_instruments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_additional_instruments_instrument` ON `user_additional_instruments` (`instrument`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`primary_instrument` text,
	`years_playing_primary` integer,
	`seeking_to_play` text,
	`primary_genre` text,
	`secondary_genres` text,
	`influences` text,
	`status` text,
	`status_expires_at` text,
	`commitment_level` text,
	`weekly_availability` text,
	`rehearsal_frequency` text,
	`gigging_level` text,
	`past_bands` text,
	`has_studio_experience` integer,
	`city` text,
	`state` text,
	`country` text,
	`latitude` integer,
	`longitude` integer,
	`travel_radius` integer,
	`has_rehearsal_space` integer,
	`has_transportation` integer,
	`seeking` text,
	`can_offer` text,
	`deal_breakers` text,
	`bio` text,
	`musical_goals` text,
	`age_range` text,
	`profile_completion` integer DEFAULT 0 NOT NULL,
	`setup_completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_user_id` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_status` ON `user_profiles` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_primary_genre` ON `user_profiles` (`primary_genre`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_city` ON `user_profiles` (`city`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_location` ON `user_profiles` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`profile_visibility` text DEFAULT 'public' NOT NULL,
	`search_visibility` integer DEFAULT true NOT NULL,
	`messaging_permission` text DEFAULT 'anyone' NOT NULL,
	`follow_permission` text DEFAULT 'anyone' NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`follow_notifications` integer DEFAULT true NOT NULL,
	`comment_notifications` integer DEFAULT true NOT NULL,
	`reaction_notifications` integer DEFAULT true NOT NULL,
	`mention_notifications` integer DEFAULT true NOT NULL,
	`band_application_notifications` integer DEFAULT true NOT NULL,
	`band_response_notifications` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_settings_user_id` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_settings_search_visibility` ON `user_settings` (`search_visibility`);--> statement-breakpoint
CREATE INDEX `idx_user_settings_profile_visibility` ON `user_settings` (`profile_visibility`);--> statement-breakpoint
CREATE TABLE `users_followers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`followed_user_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`followed_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jwkss` (
	`id` text PRIMARY KEY NOT NULL,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_active_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
