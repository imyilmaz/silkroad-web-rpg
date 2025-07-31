import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ items: [] })
  }

  const items = await prisma.inventoryItem.findMany({
    where: { characterId: parseInt(params.id) }, // çünkü id tipi Int
    include: { item: true },
  })

  return NextResponse.json({
    items: items.map((i:any) => ({
      id: i.id,
      name: i.item.name,
      icon: i.item.icon || 'default.png',
      slotIndex: i.slotIndex,
      quantity: i.quantity,
    })),
  })
}
