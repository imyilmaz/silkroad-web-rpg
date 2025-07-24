import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  // Giriş yapılmamışsa ve istek korumalı sayfalardan birine ise => yönlendir
  const protectedRoutes = [
    '/home',
    '/character',
    '/character/create',
    '/admin',
    '/api/character',
    '/api/admin',
  ]

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  )

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/', req.url)) // Anasayfa
  }

  // Token varsa doğruluğunu kontrol et
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
      return NextResponse.next()
    } catch (err) {
      console.warn('Geçersiz JWT:', err)
      // Token bozuksa yönlendir
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}
