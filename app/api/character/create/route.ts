import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const INITIAL_GOLD = 500;

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Giriş yapılmamış." }, { status: 401 });
    }

    const { name, race } = await req.json();
    if (!name || !race) {
      return NextResponse.json(
        { message: "Karakter adı ve köken seçimi zorunludur." },
        { status: 400 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    const existing = await prisma.character.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { message: "Bu isimde bir karakter zaten var." },
        { status: 400 },
      );
    }

    const origin = await prisma.characterOrigin.findUnique({
      where: { slug: race },
      include: { startingItems: true },
    });

    if (!origin) {
      return NextResponse.json(
        { message: "Seçilen köken tanınmıyor." },
        { status: 400 },
      );
    }

    const character = await prisma.character.create({
      data: {
        name,
        race,
        origin: { connect: { id: origin.id } },
        userId: decoded.userId,
        gold: INITIAL_GOLD,
      },
    });

    if (origin.startingItems.length > 0) {
      await prisma.inventoryItem.createMany({
        data: origin.startingItems.map((entry, index) => ({
          characterId: character.id,
          itemId: entry.itemId,
          quantity: entry.quantity,
          slotIndex: entry.slotIndex ?? index,
        })),
      });
    }

    return NextResponse.json({
      message: "Karakter oluşturuldu.",
      character,
    });
  } catch (err) {
    console.error("Create Character Error:", err);
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}
