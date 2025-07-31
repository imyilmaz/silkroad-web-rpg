import { NextResponse } from 'next/server'

const items = [
  { id: 1, name: 'Blade', level: 1, type: 'weapon', price: 100 },
  { id: 2, name: 'Sword', level: 1, type: 'weapon', price: 100 },
  { id: 3, name: 'Spear', level: 1, type: 'weapon', price: 100 },
  { id: 4, name: 'Glavie', level: 1, type: 'weapon', price: 100 },
  { id: 5, name: 'Bow', level: 1, type: 'weapon', price: 100 },
  { id: 6, name: 'Shield', level: 1, type: 'shield', price: 100 },
  { id: 7, name: 'Blade', level: 8, type: 'weapon', price: 500 },
  { id: 8, name: 'Sword', level: 8, type: 'weapon', price: 500 },
  { id: 9, name: 'Spear', level: 8, type: 'weapon', price: 500 },
  { id: 10, name: 'Glavie', level: 8, type: 'weapon', price: 500 },
  { id: 11, name: 'Bow', level: 8, type: 'weapon', price: 500 },
  { id: 12, name: 'Shield', level: 8, type: 'shield', price: 500 },
  { id: 13, name: 'Blade', level: 16, type: 'weapon', price: 2000 },
  { id: 14, name: 'Sword', level: 16, type: 'weapon', price: 2000 },
  { id: 15, name: 'Spear', level: 16, type: 'weapon', price: 2000 },
  { id: 16, name: 'Glavie', level: 16, type: 'weapon', price: 2000 },
  { id: 17, name: 'Bow', level: 16, type: 'weapon', price: 2000 },
  { id: 18, name: 'Shield', level: 16, type: 'shield', price: 2000 },
]

export async function GET() {
  return NextResponse.json({ items })
}