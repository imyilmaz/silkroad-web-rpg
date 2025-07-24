import { NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const user = await getUserFromToken()
  if (!user) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 })
  }

  // Seçili karakter varsa session'da karakteri getir
  const session = await prisma.session.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      character: true,
    },
  })

  if (!session || !session.character) {
    return NextResponse.json({ hasCharacter: true, selected: false })
  }

  return NextResponse.json({
    hasCharacter: true,
    selected: true,
    character: {
      name: session.character.name,
      level: session.character.level,
      race: session.character.race,
    },
  })
}
