import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ message: 'Kullanıcı silindi.' })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
