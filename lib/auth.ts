import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from './prisma'

export async function getUserFromToken() {
  const token = (await cookies()).get('token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number },
    })

    return user
  } catch (err) {
    console.error('Token doğrulanamadı:', err)
    return null
  }
}
