import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { id, username, email, password } = await req.json()

    const data: any = { username, email }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      data.password = hashedPassword
    }

    await prisma.user.update({
      where: { id },
      data,
    })

    return NextResponse.json({ message: 'Kullanıcı güncellendi.' })
  } catch (err) {
    console.error('Update error:', err)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
