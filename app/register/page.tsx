'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading/loading";

const securityQuestions = [
  "Favori s\u00fct \u00fcr\u00fcn\u00fcn\u00fcz nedir?",
  "\u0130lk evcil hayvan\u0131n\u0131z\u0131n ad\u0131 neydi?",
  "\u00c7ocuklu\u011funuzda ya\u015fad\u0131\u011f\u0131n\u0131z kasaban\u0131n ad\u0131?",
  "Size ilham veren bir ki\u015fi var m\u0131?",
];

const RegisterPage = () => {
  const router = useRouter();
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [correctedCaptcha, setCorrectedCaptcha] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: securityQuestions[0],
    securityAnswer: "",
    captchaAnswer: "",
  });

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    setCaptcha({ a, b });
    setCorrectedCaptcha(a + b);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("\u015eifreler uyu\u015fmuyor.");
      setLoading(false);
      return;
    }

    if (parseInt(form.captchaAnswer, 10) !== correctedCaptcha) {
      setError("Bot do\u011frulamas\u0131 ba\u015far\u0131s\u0131z.");
      setLoading(false);
      generateCaptcha();
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Kay\u0131t s\u0131ras\u0131nda bir sorun olu\u015ftu.");
      setLoading(false);
    } else {
      setSuccess(
        "Kay\u0131t ba\u015far\u0131l\u0131! Giri\u015f sayfas\u0131na y\u00f6nlendiriliyorsunuz...",
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div className="register-page">
      <h2>Kay\u0131t Ol</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Kullan\u0131c\u0131 Ad\u0131"
          value={form.username}
          onChange={handleChange}
          required
        />
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
          placeholder="\u015eifre"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="\u015eifre Tekrar"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <select
          name="securityQuestion"
          value={form.securityQuestion}
          onChange={handleChange}
        >
          {securityQuestions.map((question) => (
            <option key={question} value={question}>
              {question}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="securityAnswer"
          placeholder="Gizli Cevap"
          value={form.securityAnswer}
          onChange={handleChange}
          required
        />

        <div>
          <label>
            Bot olmad\u0131\u011f\u0131n\u0131z\u0131 kan\u0131tlay\u0131n: {captcha.a} + {captcha.b} = ?
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
          Kay\u0131t Ol
        </button>
      </form>

      {loading && <Loading />}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
};

export default RegisterPage;
