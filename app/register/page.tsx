import Link from 'next/link';
import '../../styles/pages/register.scss';

export default function RegisterPage() {
  return (
    <main className="auth-screen">
      <h1>Kayıt Ol</h1>
      <form>
        <input type="text" placeholder="Kullanıcı Adı" />
        <input type="email" placeholder="E-posta" />
        <input type="password" placeholder="Şifre" />
        <button type="submit">Kayıt Ol</button>
        <Link href="/" className="btn">Geri Dön</Link>
      </form>
    </main>
  );
}
