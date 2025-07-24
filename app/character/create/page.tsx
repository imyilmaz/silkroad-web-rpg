'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const CreateCharacterPage = () => {
    const router = useRouter()
    const [name, setName] = useState('')
    const [race, setRace] = useState('Asia')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        const res = await fetch('/api/character/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, race }),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.message || 'Karakter oluşturulamadı.')
        } else {
            setSuccess('Karakter oluşturuldu!')
            router.push('/character')
        }
    }

    return (
        <div className="character-create-page">
            <div className="form-box">
                <h2>Karakter Oluştur</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Karakter Adı"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div className="form-group">
                        <label>Irk Seçimi:</label>
                        <select value={race} onChange={(e) => setRace(e.target.value)}>
                            <option value="Asia">Asya</option>
                            <option value="Europe" disabled>Avrupa (yakında)</option>
                            <option value="Arab" disabled>Arap (yakında)</option>
                        </select>
                    </div>

                    <button type="submit">Oluştur</button>
                </form>

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
        </div>
    )
}

export default CreateCharacterPage
