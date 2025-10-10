'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Character = {
  name: string;
  level: number;
  race: string;
};

const originLabels: Record<string, string> = {
  "sunweaver-nomad": "G\u00fcn Dokuyucusu G\u00f6\u00e7ebe",
  "moondrift-oracle": "Ay S\u00fcz\u00fcl\u00fc Kahini",
  "stormborne-guard": "F\u0131rt\u0131nado\u011fan Muhaf\u0131z",
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
      <h1>Ho\u015f geldin, {character?.name}!</h1>
      <p>
        Seviye: {character?.level} | K\u00f6ken:{" "}
        {character ? originLabels[character.race] ?? character.race : ""}
      </p>
      <p>S\u00fct yollar\u0131ndaki maceran seni \u00e7a\u011f\u0131r\u0131yor.</p>
      <div className="home-buttons">
        <button className="btn primary" onClick={() => router.push("/character")}>
          Karakter Se\u00e7
        </button>
        <button
          className="btn secondary"
          onClick={() => router.push("/cities/sutara")}
        >
          Oyuna Ba\u015fla
        </button>
      </div>
    </main>
  );
}
