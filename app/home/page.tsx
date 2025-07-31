'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Character = {
  name: string
  level: number
  race: string
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [character, setCharacter] = useState<Character | null>(null)

  useEffect(() => {
    const checkCharacter = async () => {
      const res = await fetch('/api/character/active')
      
      if (!res.ok) {
        // Aktif karakter yoksa karakter seçme ekranına at
        router.push('/character')
        return
      }

      const data = await res.json()
      setCharacter(data.character)
      setChecking(false)
    }

    checkCharacter()
  }, [router])

  if (checking) return null

  return (
    <main className="home-screen">
      <h1>Hoşgeldin, {character?.name}!</h1>
      <p>Seviye: {character?.level} | Irk: {character?.race}</p>
      <p>Hazırsan maceraya başlayabilirsin!</p>
      <div className="home-buttons">
        <button className="btn primary" onClick={() => router.push('/character')}>
          Karakter Seç
        </button>
        <button className="btn secondary" onClick={() => router.push('/cities/konya')}>Oyuna Başla</button>
      </div>
    </main>
  )
}
