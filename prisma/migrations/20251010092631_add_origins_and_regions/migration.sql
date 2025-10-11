-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('ACTIVE', 'PASSIVE', 'BUFF');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('CITY', 'FIELD', 'DUNGEON', 'HARBOR', 'WILDERNESS');

-- CreateEnum
CREATE TYPE "RegionFeatureType" AS ENUM ('NPC', 'SERVICE', 'GATE', 'FERRY', 'DUNGEON_ENTRANCE', 'TRAINING', 'LORE');

-- CreateEnum
CREATE TYPE "NpcType" AS ENUM ('BLACKSMITH', 'ALCHEMIST', 'TAILOR', 'TRAINER', 'FERRYMASTER', 'QUESTGIVER', 'MERCHANT', 'GUARD', 'SAGE');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "originId" INTEGER;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "description" TEXT,
ADD COLUMN     "levelRequirement" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE "CharacterOrigin" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "focus" TEXT,
    "affinity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OriginStartingItem" (
    "id" SERIAL NOT NULL,
    "originId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "slotIndex" INTEGER,

    CONSTRAINT "OriginStartingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDiscipline" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "element" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillDiscipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "disciplineId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "SkillType" NOT NULL,
    "rankMax" INTEGER NOT NULL DEFAULT 1,
    "resourceCost" INTEGER,
    "cooldownSeconds" INTEGER,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "unlockCost" INTEGER NOT NULL DEFAULT 0,
    "rankCost" INTEGER NOT NULL DEFAULT 0,
    "prerequisiteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RegionType" NOT NULL,
    "description" TEXT NOT NULL,
    "ambientTag" TEXT,
    "levelMin" INTEGER,
    "levelMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionConnection" (
    "id" SERIAL NOT NULL,
    "fromRegionId" INTEGER NOT NULL,
    "toRegionId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "travelTime" INTEGER,
    "requirement" TEXT,

    CONSTRAINT "RegionConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Npc" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "type" "NpcType" NOT NULL,
    "description" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Npc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionFeature" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RegionFeatureType" NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "npcId" INTEGER,
    "targetRegionId" INTEGER,
    "posX" DOUBLE PRECISION,
    "posY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopListing" (
    "id" SERIAL NOT NULL,
    "npcId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gold',
    "stock" INTEGER,

    CONSTRAINT "ShopListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterOrigin_slug_key" ON "CharacterOrigin"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OriginStartingItem_originId_itemId_key" ON "OriginStartingItem"("originId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDiscipline_slug_key" ON "SkillDiscipline"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSkill_characterId_skillId_key" ON "CharacterSkill"("characterId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RegionConnection_fromRegionId_toRegionId_key" ON "RegionConnection"("fromRegionId", "toRegionId");

-- CreateIndex
CREATE UNIQUE INDEX "Npc_slug_key" ON "Npc"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RegionFeature_regionId_slug_key" ON "RegionFeature"("regionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShopListing_npcId_itemId_key" ON "ShopListing"("npcId", "itemId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_originId_fkey" FOREIGN KEY ("originId") REFERENCES "CharacterOrigin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OriginStartingItem" ADD CONSTRAINT "OriginStartingItem_originId_fkey" FOREIGN KEY ("originId") REFERENCES "CharacterOrigin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OriginStartingItem" ADD CONSTRAINT "OriginStartingItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "SkillDiscipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSkill" ADD CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSkill" ADD CONSTRAINT "CharacterSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionConnection" ADD CONSTRAINT "RegionConnection_fromRegionId_fkey" FOREIGN KEY ("fromRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionConnection" ADD CONSTRAINT "RegionConnection_toRegionId_fkey" FOREIGN KEY ("toRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Npc" ADD CONSTRAINT "Npc_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionFeature" ADD CONSTRAINT "RegionFeature_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionFeature" ADD CONSTRAINT "RegionFeature_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "Npc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionFeature" ADD CONSTRAINT "RegionFeature_targetRegionId_fkey" FOREIGN KEY ("targetRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopListing" ADD CONSTRAINT "ShopListing_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "Npc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopListing" ADD CONSTRAINT "ShopListing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
