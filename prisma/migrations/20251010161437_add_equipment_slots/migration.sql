-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON_MAIN', 'WEAPON_OFF', 'HEAD', 'SHOULDERS', 'CHEST', 'GLOVES', 'LEGS', 'FEET', 'NECK', 'EARRING', 'RING_1', 'RING_2', 'SPECIAL', 'JOB');

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "isEquipped" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "slotIndex" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "equipmentSlot" "EquipmentSlot",
ADD COLUMN     "handsRequired" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "CharacterEquipment" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "inventoryItemId" INTEGER,

    CONSTRAINT "CharacterEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterEquipment_characterId_slot_key" ON "CharacterEquipment"("characterId", "slot");

-- AddForeignKey
ALTER TABLE "CharacterEquipment" ADD CONSTRAINT "CharacterEquipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterEquipment" ADD CONSTRAINT "CharacterEquipment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
