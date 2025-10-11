'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading/loading";

const LoginPage = () => {
  const router = useRouter();
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [correctedCaptcha, setCorrectedCaptcha] = useState(0);

  const [form, setForm] = useState({
    email: "",
    password: "",
    captchaAnswer: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    setCaptcha({ a, b });
    setCorrectedCaptcha(a + b);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (parseInt(form.captchaAnswer, 10) !== correctedCaptcha) {
      setError("Bot doğrulaması başarısız.");
      generateCaptcha();
      return;
    }

    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message || "Bir hata oluştu.");
    } else {
      setSuccess("Giriş başarılı! Ana ekrana yönlendiriliyorsunuz...");
      setTimeout(() => {
        router.push("/home");
      }, 2000);
    }
  };

  return (
    <div className="login-page">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handleChange}
          required
        />

        <div>
          <label>
            Bot olmadığınızı kanıtlayın: {captcha.a} + {captcha.b} = ?
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              name="captchaAnswer"
              placeholder="Cevap"
              value={form.captchaAnswer}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={generateCaptcha}>
              Yenile
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          Giriş Yap
        </button>
      </form>

      {loading && <Loading />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
};

export default LoginPage;
