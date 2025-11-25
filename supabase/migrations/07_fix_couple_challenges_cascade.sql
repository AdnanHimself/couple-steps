-- Migration: Fix couple_challenges cascade deletion
-- Date: 2025-11-25
-- Purpose: Ensure couple_challenges are deleted when couple relationship is broken

-- Add CASCADE DELETE to couple_challenges foreign key
ALTER TABLE couple_challenges
  DROP CONSTRAINT IF EXISTS couple_challenges_couple_id_fkey,
  ADD CONSTRAINT couple_challenges_couple_id_fkey
    FOREIGN KEY (couple_id)
    REFERENCES couples(id)
    ON DELETE CASCADE;
