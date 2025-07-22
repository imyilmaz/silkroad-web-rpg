export default function HomePage() {
  const username = "Oyuncu"; // Gerçek login sonrası kullanıcıdan alınacak

  return (
    <main className="home-screen">
      <h1>Hoşgeldin, {username}!</h1>
      <p>Hazırsan maceraya başlayabilirsin!</p>
      <div className="home-buttons">
        <button className="btn primary">Karakter Seç</button>
        <button className="btn secondary">Oyuna Başla</button>
      </div>
    </main>
  );
}