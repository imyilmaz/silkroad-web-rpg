import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ message: 'Email ve kod zorunludur.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 404 })
    }

    if (user.isBlocked) {
      return NextResponse.json({ message: 'Bu kullanıcı engellenmiştir. Giriş yapamazsınız.' }, { status: 403 })
    }

    if (!user.isAdmin || !user.adminCode || !user.adminCodeExpiry) {
      return NextResponse.json({ message: 'Kod geçersiz veya kullanıcı admin değil.' }, { status: 403 })
    }

    const now = new Date()
    if (user.adminCode !== code || now > user.adminCodeExpiry) {
      return NextResponse.json({ message: 'Kod geçersiz veya süresi dolmuş.' }, { status: 403 })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin: true,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    const cookie = serialize('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60,
    })

    return new NextResponse(
      JSON.stringify({ message: 'Giriş başarılı' }),
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('VERIFY ERROR', error)
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 })
  }
}
