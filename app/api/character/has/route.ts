import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET() {
  const token = ( await cookies()).get("token")?.value
  if (!token) return NextResponse.json({ hasCharacter: false })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    const userId = (decoded as any).userId

    const charCount = await prisma.character.count({
      where: { userId },
    })

    return NextResponse.json({ hasCharacter: charCount > 0 })
  } catch (err) {
    console.error("Character check error:", err)
    return NextResponse.json({ hasCharacter: false })
  }
}
