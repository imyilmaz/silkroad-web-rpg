'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Character = {
  name: string;
  level: number;
  race: string;
};

const originLabels: Record<string, string> = {
  "sunweaver-nomad": "Gün Dokuyucusu Göçebe",
  "moondrift-oracle": "Ay Süzülü Kahini",
  "stormborne-guard": "Fırtınadoğan Muhafız",
};

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const checkCharacter = async () => {
      const res = await fetch("/api/character/active");

      if (!res.ok) {
        router.push("/character");
        return;
      }

      const data = await res.json();
      setCharacter(data.character);
      setChecking(false);
    };

    checkCharacter();
  }, [router]);

  if (checking) return null;

  return (
    <main className="home-screen">
      <h1>Hoş geldin, {character?.name}!</h1>
      <p>
        Seviye: {character?.level} | Köken:{" "}
        {character ? originLabels[character.race] ?? character.race : ""}
      </p>
      <p>Süt yollarındaki maceran seni çağırıyor.</p>
      <div className="home-buttons">
        <button className="btn primary" onClick={() => router.push("/character")}>
          Karakter Seç
        </button>
        <button
          className="btn secondary"
          onClick={() => router.push("/cities/sutara")}
        >
          Oyuna Başla
        </button>
      </div>
    </main>
  );
}
