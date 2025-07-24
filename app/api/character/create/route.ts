import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value
    if (!token) return NextResponse.json({ message: 'Giriş yapılmamış.' }, { status: 401 })

    const { name, race } = await req.json()
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const existing = await prisma.character.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ message: 'Bu isimde bir karakter zaten var.' }, { status: 400 })
    }

    const character = await prisma.character.create({
      data: {
        name,
        race,
        userId: decoded.userId,
      },
    })

    return NextResponse.json({ message: 'Karakter oluşturuldu.', character })
  } catch (err) {
    console.error('Create Character Error:', err)
    return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
  }
}
