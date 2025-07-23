import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, email, password, securityQuestion, securityAnswer } = body

    if (!username || !email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ message: 'Tüm alanlar zorunludur.' }, { status: 400 })
    }

    // Email ya da kullanıcı adı daha önce kullanılmış mı?

    const existingUser = await prisma.user.findUnique({ where: { email } })



    if (existingUser) {
      return NextResponse.json({ message: 'Bu kullanıcı adı veya email zaten kullanılıyor.' }, { status: 400 })
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yeni kullanıcıyı oluştur
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        securityQuestion,
        securityAnswer,
      },
    })

    return NextResponse.json({ message: 'Kayıt başarılı!', user: { id: newUser.id, username: newUser.username } })
  } catch (error: any) {
  console.error('🔴 REGISTER API ERROR 🔴')
  console.error('Tipi:', typeof error)
  console.error('Error instance:', error instanceof Error)
  console.error('Stack trace:', error?.stack)
  console.error('Full:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
  return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
