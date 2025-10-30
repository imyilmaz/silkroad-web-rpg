-- Add stat-related fields to Character table
ALTER TABLE "Character"
  ADD COLUMN     "statPoints" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN     "strength" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN     "intelligence" INTEGER NOT NULL DEFAULT 20;
