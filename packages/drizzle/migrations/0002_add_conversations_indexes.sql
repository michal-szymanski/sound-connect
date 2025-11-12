-- Migration: Add indexes for efficient conversation queries
-- Created: 2025-11-12
-- Purpose: Optimize messages table queries for conversations list

-- Index for finding all messages where user is sender
-- Supports: WHERE sender_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created
ON messages(sender_id, receiver_id, created_at DESC);

-- Index for finding all messages where user is receiver
-- Supports: WHERE receiver_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_created
ON messages(receiver_id, sender_id, created_at DESC);

-- Index for efficient blocked users filtering in both directions
-- Supports: WHERE blocker_id = ? AND blocked_id = ?
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_blocked
ON blocked_users(blocker_id, blocked_id);
