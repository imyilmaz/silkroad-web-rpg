import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Token bulunamadı.' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return NextResponse.json({ message: 'Yetkili erişim!', user: decoded })
  } catch (error) {
    return NextResponse.json({ message: 'Geçersiz token!' }, { status: 403 })
  }
}
