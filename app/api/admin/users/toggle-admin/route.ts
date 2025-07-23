import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId  } = await req.json()
    const id = Number(userId)

    const user = await prisma.user.findUnique({ where: { id } })
    
    if (!user) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin },
    })

    return NextResponse.json({ message: 'Admin durumu güncellendi' })
  } catch (err) {
    console.error('Toggle admin error:', err)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
