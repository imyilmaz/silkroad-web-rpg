import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET() {
  const user = await getUserFromToken()
  if (!user) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 })
  }

  const session = await prisma.session.findFirst({
    where: { userId: user.id },
    include: { character: true },
  })

  if (!session || !session.character) {
    return NextResponse.json({ hasCharacter: true, selected: false })
  }

  return NextResponse.json({
    hasCharacter: true,
    selected: true,
    character: {
      id: session.character.id,
      name: session.character.name,
      level: session.character.level,
      race: session.character.race,
      gold: session.character.gold,
    },
  })
}
