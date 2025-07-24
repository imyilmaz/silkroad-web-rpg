'use client'

import React, { useEffect, useState } from 'react'

type Character = {
  id: number
  name: string
  race: string
  level: number
  exp: number
}

const CharacterPage = () => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    const res = await fetch('/api/character/list')
    const data = await res.json()

    setCharacters(data.characters)
    setSelectedId(data.activeCharacterId)
  }

  const handleSelect = async (id: number) => {
    const res = await fetch('/api/character/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      setSelectedId(id)
    }
  }

  const handleDeselect = async () => {
    const res = await fetch('/api/character/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: null }), // veya backend boş bırakılmış `id`'yi deselect anlamında kullanabilir
    })

    if (res.ok) {
      setSelectedId(null)
    }
  }

  return (
    <div className="character-page">
      <h2>Karakterlerin</h2>

      <button
        onClick={() => window.location.href = '/home'}
        style={{
          margin: '40px auto',
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          backgroundColor: '#8c37d1ff',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Şehire Dön
      </button>

      {characters.length === 0 && (
        <button
          onClick={() => window.location.href = '/character/create'}
          style={{
            margin: '40px auto',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '8px',
            backgroundColor: '#d8b800ff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Karakter Oluştur
        </button>
      )}

      {selectedId && (
        <div className="active-character">
          <h3>Aktif Karakter</h3>
          {characters
            .filter((char) => char.id === selectedId)
            .map((char) => (
              <div key={char.id}>
                <p><strong>İsim:</strong> {char.name}</p>
                <p><strong>Irk:</strong> {char.race}</p>
                <p><strong>Seviye:</strong> {char.level}</p>
                <p><strong>XP:</strong> {char.exp}</p>
                <button
                  className="deselect-btn"
                  onClick={handleDeselect}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    backgroundColor: '#999',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                  }}
                >
                  Seçimi Kaldır
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="character-list">
        {characters
          .filter((char) => char.id !== selectedId)
          .map((char) => (
            <div key={char.id} className="character-card">
              <div className="info">
                <p>{char.name} ({char.race})</p>
                <p>Lv: {char.level}</p>
              </div>
              <button
                className="select-btn"
                onClick={() => handleSelect(char.id)}
              >
                Seç
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}

export default CharacterPage
