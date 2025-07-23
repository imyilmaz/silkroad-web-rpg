import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomInt } from 'crypto'
import dayjs from 'dayjs'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isAdmin) {
      return NextResponse.json({ message: 'Admin yetkisi yok veya kullanıcı bulunamadı' }, { status: 403 })
    }

    const code = randomInt(100000, 999999).toString()
    const expiry = dayjs().add(10, 'minute').toDate()

    await prisma.user.update({
      where: { email },
      data: { adminCode: code, adminCodeExpiry: expiry },
    })

    // Not: Şimdilik sadece konsola yazılıyor. Daha sonra email servisi bağlanacak.
    console.log(`Admin kodu: ${code}`)

    return NextResponse.json({ message: 'Kod gönderildi' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
