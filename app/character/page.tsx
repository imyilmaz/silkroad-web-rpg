'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Character = {
  id: number;
  name: string;
  race: string;
  level: number;
  exp: number;
};

const originLabels: Record<string, string> = {
  "sunweaver-nomad": "Gün Dokuyucusu Göçebe",
  "moondrift-oracle": "Ay Süzülü Kahini",
  "stormborne-guard": "Fırtınadoğan Muhafız",
};

const CharacterPage = () => {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeCharacter = useMemo(
    () => characters.find((char) => char.id === selectedId) ?? null,
    [characters, selectedId],
  );

  useEffect(() => {
    void fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const res = await fetch("/api/character/list");
    if (!res.ok) return;

    const data = await res.json();
    setCharacters(data.characters ?? []);
    setSelectedId(data.activeCharacterId ?? null);
  };

  const handleSelect = async (id: number | null) => {
    const res = await fetch("/api/character/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setSelectedId(id);
    }
  };

  return (
    <div className="character-page">
      <h2>Karakterlerin</h2>

      <button
        onClick={() => router.push("/home")}
        style={{
          margin: "32px auto",
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          backgroundColor: "#8c37d1",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Sığınağa Dön
      </button>

      {characters.length === 0 && (
        <button
          onClick={() => router.push("/character/create")}
          style={{
            margin: "40px auto",
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            backgroundColor: "#d8b800",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Karakter Oluştur
        </button>
      )}

      {activeCharacter && (
        <div className="active-character">
          <h3>Aktif Karakter</h3>
          <div>
            <p>
              <strong>İsim:</strong> {activeCharacter.name}
            </p>
            <p>
              <strong>Köken:</strong>{" "}
              {originLabels[activeCharacter.race] ?? activeCharacter.race}
            </p>
            <p>
              <strong>Seviye:</strong> {activeCharacter.level}
            </p>
            <p>
              <strong>Deneyim:</strong> {activeCharacter.exp}
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                className="deselect-btn"
                onClick={() => handleSelect(null)}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#666",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Seçimi Kaldır
              </button>
              <button
                type="button"
                onClick={() => router.push("/cities/sutara")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#f2c675",
                  color: "#2c1d16",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Oyuna Başla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="character-list">
        {characters
          .filter((char) => char.id !== selectedId)
          .map((char) => (
            <div key={char.id} className="character-card">
              <div className="info">
                <p>
                  {char.name} ({originLabels[char.race] ?? char.race})
                </p>
                <p>Seviye: {char.level}</p>
              </div>
              <button
                className="select-btn"
                onClick={() => handleSelect(char.id)}
              >
                Seç
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CharacterPage;

