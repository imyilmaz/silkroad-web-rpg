import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: 'Email ve şifre gerekli.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 404 })
    }

    // ✅ Engelli kontrolü
    if (user.isBlocked) {
      return NextResponse.json({ message: 'Bu kullanıcı engellenmiştir.' }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Şifre yanlış.' }, { status: 401 })
    }

    // ✅ JWT oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // ✅ Cookie ayarla
    const cookie = serialize('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    const response = NextResponse.json({ message: 'Giriş başarılı.' }, { status: 200 })
    response.headers.set('Set-Cookie', cookie)
    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
  }
}
