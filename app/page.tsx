import Link from "next/link";
import "../styles/pages/welcome.scss";

export default function Home() {
  return (
    <main className="welcome-screen">
      <h1>Milkroad Online&apos;a Ho\u015f geldiniz</h1>
      <div className="buttons">
        <Link href="/register" className="btn register">
          Kay\u0131t Ol
        </Link>
        <Link href="/login" className="btn login">
          Giri\u015f Yap
        </Link>
      </div>
    </main>
  );
}
