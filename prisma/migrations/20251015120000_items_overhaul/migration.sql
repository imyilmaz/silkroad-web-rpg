-- CreateEnum
CREATE TYPE "ItemRace" AS ENUM ('CH', 'EU', 'GLOBAL');

-- CreateEnum
CREATE TYPE "ItemGender" AS ENUM ('MALE', 'FEMALE', 'ANY');

-- CreateEnum
CREATE TYPE "ItemUpgradeModel" AS ENUM ('TABLE');

-- AlterTable
ALTER TABLE "Item"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "codeName" TEXT,
  ADD COLUMN "stringNameKey" TEXT,
  ADD COLUMN "stringDescKey" TEXT,
  ADD COLUMN "modelPath" TEXT,
  ADD COLUMN "degree" INTEGER,
  ADD COLUMN "race" "ItemRace" NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN "categoryPath" TEXT,
  ADD COLUMN "magicOptionLimit" INTEGER,
  ADD COLUMN "bindType" TEXT,
  ADD COLUMN "canUseAdvancedElixir" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ItemTranslation" (
  "id" SERIAL PRIMARY KEY,
  "itemId" INTEGER NOT NULL,
  "language" TEXT NOT NULL,
  "name" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemRequirement" (
  "itemId" INTEGER PRIMARY KEY,
  "minLevel" INTEGER,
  "masteryCode" TEXT,
  "gender" "ItemGender",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemStatProfile" (
  "itemId" INTEGER PRIMARY KEY,
  "phyAtkMin" DOUBLE PRECISION,
  "phyAtkMax" DOUBLE PRECISION,
  "magAtkMin" DOUBLE PRECISION,
  "magAtkMax" DOUBLE PRECISION,
  "attackDistance" DOUBLE PRECISION,
  "attackRate" DOUBLE PRECISION,
  "critical" DOUBLE PRECISION,
  "durability" DOUBLE PRECISION,
  "parryRatio" DOUBLE PRECISION,
  "blockRatio" DOUBLE PRECISION,
  "phyReinforceMin" DOUBLE PRECISION,
  "phyReinforceMax" DOUBLE PRECISION,
  "magReinforceMin" DOUBLE PRECISION,
  "magReinforceMax" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemPricing" (
  "itemId" INTEGER PRIMARY KEY,
  "price" INTEGER,
  "stackSize" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'gold',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemUpgradeProfile" (
  "itemId" INTEGER PRIMARY KEY,
  "model" "ItemUpgradeModel",
  "tableKey" TEXT,
  "maxPlus" INTEGER,
  "formulaWhite" TEXT,
  "formulaReinforce" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GameSetting" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_slug_key" ON "Item"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTranslation_itemId_language_key" ON "ItemTranslation"("itemId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "GameSetting_key_key" ON "GameSetting"("key");

-- AddForeignKey
ALTER TABLE "ItemTranslation"
  ADD CONSTRAINT "ItemTranslation_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRequirement"
  ADD CONSTRAINT "ItemRequirement_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemStatProfile"
  ADD CONSTRAINT "ItemStatProfile_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPricing"
  ADD CONSTRAINT "ItemPricing_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemUpgradeProfile"
  ADD CONSTRAINT "ItemUpgradeProfile_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
