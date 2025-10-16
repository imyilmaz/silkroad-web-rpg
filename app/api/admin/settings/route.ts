import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requireAdmin() {
  const user = await getUserFromToken();
  if (!user) {
    throw new HttpError("Oturum bulunamadı.", 401);
  }
  if (!user.isAdmin) {
    throw new HttpError("Bu işlem için yetkiniz yok.", 403);
  }
  return user;
}

export async function GET() {
  try {
    await requireAdmin();

    const settings = await prisma.gameSetting.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[ADMIN][SETTINGS][GET]", error);
    return NextResponse.json({ message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}

type UpdatePayload = {
  key?: string;
  value?: unknown;
  description?: string | null;
};

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as UpdatePayload;
    if (!body.key || typeof body.key !== "string") {
      throw new HttpError("Geçerli bir ayar anahtarı gerekli.", 400);
    }

    let value: unknown = body.value ?? null;

    if (body.key === "maxCharacterLevel") {
      const currentRaw = (body.value as { current?: unknown })?.current;
      const plannedRaw = (body.value as { plannedCaps?: unknown })?.plannedCaps;

      const current = Number(currentRaw);
      if (!Number.isInteger(current) || current <= 0) {
        throw new HttpError("Mevcut seviye sınırı pozitif bir tam sayı olmalıdır.", 400);
      }

      const plannedCaps = Array.isArray(plannedRaw)
        ? plannedRaw
            .map((entry) => Number(entry))
            .filter((entry) => Number.isInteger(entry) && entry > 0)
        : [];

      value = {
        current,
        plannedCaps,
      };
    }

    const updated = await prisma.gameSetting.upsert({
      where: { key: body.key },
      update: {
        value,
        description: body.description ?? undefined,
      },
      create: {
        key: body.key,
        value,
        description: body.description ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[ADMIN][SETTINGS][PATCH]", error);
    return NextResponse.json({ message: "Ayar güncellenemedi." }, { status: 500 });
  }
}
