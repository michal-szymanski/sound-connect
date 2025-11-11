-- Migration: Add user settings and blocked users tables
-- Created: 2025-11-11
-- Purpose: Support settings page feature (privacy, notifications, blocking)

-- Create user_settings table for privacy and notification preferences
CREATE TABLE `user_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL UNIQUE,

  -- Privacy settings
  `profile_visibility` text NOT NULL DEFAULT 'public' CHECK(`profile_visibility` IN ('public', 'followers_only', 'private')),
  `search_visibility` integer NOT NULL DEFAULT 1,
  `messaging_permission` text NOT NULL DEFAULT 'anyone' CHECK(`messaging_permission` IN ('anyone', 'followers', 'none')),
  `follow_permission` text NOT NULL DEFAULT 'anyone' CHECK(`follow_permission` IN ('anyone', 'approval', 'none')),

  -- Notification settings (email)
  `email_enabled` integer NOT NULL DEFAULT 1,
  `follow_notifications` integer NOT NULL DEFAULT 1,
  `comment_notifications` integer NOT NULL DEFAULT 1,
  `reaction_notifications` integer NOT NULL DEFAULT 1,
  `mention_notifications` integer NOT NULL DEFAULT 1,
  `band_application_notifications` integer NOT NULL DEFAULT 1,
  `band_response_notifications` integer NOT NULL DEFAULT 1,

  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Indexes for user_settings
CREATE INDEX `idx_user_settings_user_id` ON `user_settings` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_settings_search_visibility` ON `user_settings` (`search_visibility`);
--> statement-breakpoint
CREATE INDEX `idx_user_settings_profile_visibility` ON `user_settings` (`profile_visibility`);
--> statement-breakpoint

-- Create blocked_users table for user blocking relationships
CREATE TABLE `blocked_users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `blocker_id` text NOT NULL,
  `blocked_id` text NOT NULL,
  `blocked_at` text NOT NULL,

  UNIQUE(`blocker_id`, `blocked_id`),
  FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Indexes for blocked_users
CREATE INDEX `idx_blocked_users_blocker` ON `blocked_users` (`blocker_id`);
--> statement-breakpoint
CREATE INDEX `idx_blocked_users_blocked` ON `blocked_users` (`blocked_id`);
