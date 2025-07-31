'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function KonyaCityPage() {
  const router = useRouter()
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [characterName, setCharacterName] = useState<string>('')

  useEffect(() => {
    fetch('/api/character/session') 
      .then(res => res.json())
      .then(data => {
        if (data.selected && data.character) {
          setCharacterId(data.character.id)
          setCharacterName(data.character.name)
        }
      })
  }, [])

  return (
    <main className="city-screen">
      <h1>Konya Şehri</h1>
      <p>Buradasın! Demirci, simya, kasılma alanı gibi yerlere gidebilirsin.</p>
      <div className="city-npcs">
        <button className="btn" onClick={() => router.push('/cities/konya/blacksmith')}>Demirci</button>
        <button className="btn" onClick={() => router.push('/cities/konya/pharmacy')}>Eczane</button>
        <button className="btn" onClick={() => router.push('/cities/konya/tailor')}>Terzi</button>
        <button className="btn" onClick={() => router.push('/cities/konya/alchemy')}>Simya</button>
        <button className="btn" onClick={() => router.push('/cities/konya/training')}>Kasılma Alanı</button>
      </div>
      <div className="character-buttons">
        <button className="btn" onClick={() => router.push(`/character/${characterId}/inventory`)}>{characterName}</button>
        <button className="btn" onClick={() => router.push('/cities/konya/training')}>Kasılma Alanı</button>
      </div>

    </main>
  )
}