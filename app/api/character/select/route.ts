import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 })
    }

    const { id } = await req.json()

    // ❗ Eğer id yoksa, seçimi kaldır
    if (!id) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
        },
      })

      return NextResponse.json({ message: 'Karakter seçimi kaldırıldı.' })
    }

    // Karakter kullanıcıya mı ait?
    const character = await prisma.character.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!character) {
      return NextResponse.json({ message: 'Karakter bulunamadı.' }, { status: 404 })
    }

    // Varsa güncelle, yoksa oluştur
    await prisma.session.upsert({
      where: { userId: user.id },
      update: { characterId: id },
      create: {
        userId: user.id,
        characterId: id,
      },
    })

    return NextResponse.json({ message: 'Karakter seçildi.' })
  } catch (err) {
    console.error('Karakter seçme hatası:', err)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
