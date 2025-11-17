import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: [
    '/home',
    '/character/:path*',
    '/admin/:path*',
    '/api/character/:path*',
    '/api/admin/:path*',
  ],
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  // Giris yapilmamissa ve istek korumali sayfalardan birine ise yonlendir
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
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  if (!token && isProtected) {
    if (isApiRoute) {
      return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', req.url)) // Anasayfa
  }

  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
      return NextResponse.next()
    } catch (err) {
      console.warn('Gecersiz JWT:', err)
      if (isApiRoute) {
        return NextResponse.json({ message: 'Gecersiz token' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}
