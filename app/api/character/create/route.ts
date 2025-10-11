import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const INITIAL_GOLD = 1000;

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Giriş yapılmamış." },
        { status: 401 },
      );
    }

    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    } catch (verifyError) {
      console.error("Create Character token verify failed:", verifyError);
      return NextResponse.json(
        { message: "Oturum doğrulanamadı." },
        { status: 401 },
      );
    }

    const { name, race } = await req.json();
    if (!name || !race) {
      return NextResponse.json(
        { message: "Karakter adı ve köken seçimi zorunludur." },
        { status: 400 },
      );
    }

    const existingForUser = await prisma.character.findFirst({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (existingForUser) {
      return NextResponse.json(
        { message: "Şimdilik yalnızca tek karakter oluşturulabilir." },
        { status: 409 },
      );
    }

    const existingByName = await prisma.character.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingByName) {
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

    const character = await prisma.$transaction(async (tx) => {
      const created = await tx.character.create({
        data: {
          name,
          race,
          originId: origin.id,
          userId: decoded.userId,
          gold: INITIAL_GOLD,
        },
      });

      if (origin.startingItems.length > 0) {
        await tx.inventoryItem.createMany({
          data: origin.startingItems.map((entry, index) => ({
            characterId: created.id,
            itemId: entry.itemId,
            quantity: entry.quantity,
            slotIndex: entry.slotIndex ?? index,
            isEquipped: false,
          })),
        });
      }

      await tx.session.upsert({
        where: { userId: decoded.userId },
        update: { characterId: created.id },
        create: { userId: decoded.userId, characterId: created.id },
      });

      return created;
    });

    return NextResponse.json({
      message: "Karakter oluşturuldu.",
      character,
    });
  } catch (err) {
    console.error("Create Character Error:", err);
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}

