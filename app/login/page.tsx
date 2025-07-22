import Link from 'next/link';
import '../../styles/pages/login.scss';

export default function LoginPage() {
  return (
    <main className="auth-screen">
      <h1>Giriş Yap</h1>
      <form>
        <input type="email" placeholder="E-posta" />
        <input type="password" placeholder="Şifre" />
        <button type="submit">Giriş Yap</button>
        <Link href="/" className="btn">Geri Dön</Link>
      </form>
    </main>
  );
}