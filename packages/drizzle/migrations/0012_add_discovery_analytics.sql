-- Migration: Add discovery_analytics table
-- Created: 2025-11-11
-- Purpose: Track band discovery feed analytics for algorithm optimization

-- Create discovery_analytics table for tracking discovery feed interactions
CREATE TABLE `discovery_analytics` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `session_id` text NOT NULL,
  `event_type` text NOT NULL CHECK(`event_type` IN ('page_view', 'card_click', 'application', 'pagination')),
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

-- Indexes for discovery_analytics
CREATE INDEX `idx_discovery_analytics_user_id` ON `discovery_analytics` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_event_type` ON `discovery_analytics` (`event_type`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_band_id` ON `discovery_analytics` (`band_id`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_created_at` ON `discovery_analytics` (`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_session_id` ON `discovery_analytics` (`session_id`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_user_event` ON `discovery_analytics` (`user_id`, `event_type`);
--> statement-breakpoint
CREATE INDEX `idx_discovery_analytics_band_event` ON `discovery_analytics` (`band_id`, `event_type`);
