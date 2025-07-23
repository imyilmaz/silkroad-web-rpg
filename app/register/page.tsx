'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/loading/loading'

const securityQuestions = [
  'Burcunuz nedir?',
  'İlk evcil hayvanınız nedir?',
  'En sevdiğiniz yemeğin adı nedir?',
  'En sevdiğiniz filmin adı nedir?',
]

const RegisterPage = () => {
  const router = useRouter()
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 })
  const [correctedCaptcha, setCorrectedCaptcha] = useState(0)

  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10)
    const b = Math.floor(Math.random() * 10)
    setCaptcha({ a, b })
    setCorrectedCaptcha(a + b)
  }
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: securityQuestions[0],
    securityAnswer: '',
    captchaAnswer: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  const [loading, setLoading] = useState(false)


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Şifreler uyuşmuyor.')
      return
    }

    if (parseInt(form.captchaAnswer) !== correctedCaptcha) {
      setError('Bot kontrolü başarısız.')
      generateCaptcha()
      return
    }


    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message)
      setLoading(false)
    } else {
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className="register-page">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Kullanıcı Adı" value={form.username} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Şifre" value={form.password} onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="Şifre Tekrar" value={form.confirmPassword} onChange={handleChange} required />

        <select name="securityQuestion" value={form.securityQuestion} onChange={handleChange}>
          {securityQuestions.map((q, i) => (
            <option key={i} value={q}>{q}</option>
          ))}
        </select>
        <input type="text" name="securityAnswer" placeholder="Gizli Cevap" value={form.securityAnswer} onChange={handleChange} required />

        <div>
          <label>Bot olmadığınızı kanıtlayın: {captcha.a} + {captcha.b} = ?</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              name="captchaAnswer"
              placeholder="Cevap"
              value={form.captchaAnswer}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={generateCaptcha}>Yenile</button>
          </div>
        </div>

        <button type="submit">Kayıt Ol</button>
      </form>

      {loading && <Loading />}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  )
}

export default RegisterPage
