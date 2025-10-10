import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const origins = await prisma.characterOrigin.findMany({
      include: {
        startingItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      origins: origins.map((origin) => ({
        slug: origin.slug,
        name: origin.name,
        description: origin.description,
        focus: origin.focus,
        affinity: origin.affinity,
        startingItems: origin.startingItems.map((entry) => ({
          itemId: entry.itemId,
          quantity: entry.quantity,
          slotIndex: entry.slotIndex,
          item: {
            name: entry.item.name,
            type: entry.item.type,
            rarity: entry.item.rarity,
            icon: entry.item.icon,
            description: entry.item.description,
          },
        })),
      })),
    });
  } catch (error) {
    console.error("Origins API error:", error);
    return NextResponse.json(
      { message: "Köken listesi getirilemedi." },
      { status: 500 },
    );
  }
}
