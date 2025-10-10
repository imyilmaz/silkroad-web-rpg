'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Character = {
  id: number;
  name: string;
  race: string;
  level: number;
  exp: number;
};

const originLabels: Record<string, string> = {
  "sunweaver-nomad": "G\u00fcn Dokuyucusu G\u00f6\u00e7ebe",
  "moondrift-oracle": "Ay S\u00fcz\u00fcl\u00fc Kahini",
  "stormborne-guard": "F\u0131rt\u0131nado\u011fan Muhaf\u0131z",
};

const CharacterPage = () => {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const res = await fetch("/api/character/list");
    const data = await res.json();

    setCharacters(data.characters);
    setSelectedId(data.activeCharacterId);
  };

  const handleSelect = async (id: number) => {
    const res = await fetch("/api/character/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setSelectedId(id);
    }
  };

  const handleDeselect = async () => {
    const res = await fetch("/api/character/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: null }),
    });

    if (res.ok) {
      setSelectedId(null);
    }
  };

  return (
    <div className="character-page">
      <h2>Karakterlerin</h2>

      <button
        onClick={() => router.push("/home")}
        style={{
          margin: "40px auto",
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          backgroundColor: "#8c37d1ff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        S\u0131\u011f\u0131na\u011fa D\u00f6n
      </button>

      {characters.length === 0 && (
        <button
          onClick={() => router.push("/character/create")}
          style={{
            margin: "40px auto",
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            backgroundColor: "#d8b800ff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Karakter Olu\u015ftur
        </button>
      )}

      {selectedId && (
        <div className="active-character">
          <h3>Aktif Karakter</h3>
          {characters
            .filter((char) => char.id === selectedId)
            .map((char) => (
              <div key={char.id}>
                <p>
                  <strong>\u0130sim:</strong> {char.name}
                </p>
                <p>
                  <strong>K\u00f6ken:</strong>{" "}
                  {originLabels[char.race] ?? char.race}
                </p>
                <p>
                  <strong>Seviye:</strong> {char.level}
                </p>
                <p>
                  <strong>Deneyim:</strong> {char.exp}
                </p>
                <button
                  className="deselect-btn"
                  onClick={handleDeselect}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    backgroundColor: "#999",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                  }}
                >
                  Se\u00e7imi Kald\u0131r
                </button>
              </div>
            ))}
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
                Se\u00e7
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CharacterPage;
