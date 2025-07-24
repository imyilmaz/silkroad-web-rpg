import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value
    if (!token) return NextResponse.json({ characters: [] })

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const characters = await prisma.character.findMany({ where: { userId } })

    return NextResponse.json({ characters, activeCharacterId: decoded.characterId || null })
  } catch (err) {
    console.error('Character List Error:', err)
    return NextResponse.json({ characters: [] }, { status: 500 })
  }
}
