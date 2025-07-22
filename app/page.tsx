import Link from "next/link";
import "../styles/pages/welcome.scss";

export default function Home() {
  return (
    <main className="welcome-screen">
      <h1>Silkroad Web RPG'ye Hoşgeldiniz</h1>
      <div className="buttons">
        <Link href="/register" className="btn register">Kayıt Ol</Link>
        <Link href="/login" className="btn login">Giriş Yap</Link>
      </div>
    </main>
  );
}
