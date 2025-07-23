'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/loading/loading'

const AdminLoginPage = () => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const router = useRouter()

  const handleSendCode = async () => {
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/admin/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (res.ok) {
      setCodeSent(true)
      setMessage('Kod gönderildi. Lütfen e-postanı kontrol et (şimdilik konsolda).')
    } else {
      setMessage(data.message || 'Kod gönderilemedi.')
    }

    setLoading(false)
  }

  const handleVerify = async () => {
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/admin/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage('Giriş başarılı! Yönlendiriliyorsunuz...')
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } else {
      setMessage(data.message || 'Kod doğrulanamadı.')
    }

    setLoading(false)
  }

  return (
    <div className="admin-login">
      <h2>Admin Girişi</h2>

      <input
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {codeSent && (
        <input
          type="text"
          placeholder="Doğrulama Kodu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      )}

      {!codeSent ? (
        <button onClick={handleSendCode} disabled={loading || !email}>
          Kodu Gönder
        </button>
      ) : (
        <button onClick={handleVerify} disabled={loading || !code}>
          Giriş Yap
        </button>
      )}

      {loading && <Loading />}
      {message && <p>{message}</p>}
    </div>
  )
}

export default AdminLoginPage
