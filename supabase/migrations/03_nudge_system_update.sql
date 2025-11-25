-- Migration: Add nudge types and read status
-- Date: 2025-11-24

-- 1. Create nudge type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nudge_type') THEN
        CREATE TYPE nudge_type AS ENUM ('motivate', 'challenge', 'cheer');
    END IF;
END $$;

-- 2. Add columns to nudges table if they don't exist
DO $$
BEGIN
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nudges' AND column_name = 'type') THEN
        ALTER TABLE nudges ADD COLUMN type nudge_type DEFAULT 'cheer';
    END IF;
    
    -- Add read status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nudges' AND column_name = 'read') THEN
        ALTER TABLE nudges ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add created_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nudges' AND column_name = 'created_at') THEN
        ALTER TABLE nudges ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Create index for faster queries on receiver_id + read status
CREATE INDEX IF NOT EXISTS idx_nudges_receiver_read ON nudges(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_nudges_created_at ON nudges(created_at DESC);
