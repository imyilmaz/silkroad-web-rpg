'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OriginItem = {
  itemId: number;
  quantity: number;
  slotIndex: number | null;
  item: {
    name: string;
    type: string;
    rarity: string | null;
    icon: string | null;
    description: string | null;
  };
};

type OriginOption = {
  slug: string;
  name: string;
  description: string;
  focus: string | null;
  affinity: string | null;
  startingItems: OriginItem[];
};

const CreateCharacterPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [originSlug, setOriginSlug] = useState("");
  const [origins, setOrigins] = useState<OriginOption[]>([]);
  const [originsLoading, setOriginsLoading] = useState(true);
  const [originsError, setOriginsError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        setOriginsLoading(true);
        const response = await fetch("/api/reference/origins");
        if (!response.ok) {
          throw new Error("Köken listesi getirilemedi.");
        }
        const payload = await response.json();
        const received: OriginOption[] = payload.origins ?? [];
        setOrigins(received);
        if (received.length > 0) {
          setOriginSlug(received[0].slug);
        }
        setOriginsError(null);
      } catch (fetchError) {
        console.error(fetchError);
        setOriginsError(
          fetchError instanceof Error
            ? fetchError.message
            : "Köken listesi alınamadı.",
        );
      } finally {
        setOriginsLoading(false);
      }
    };

    fetchOrigins();
  }, []);

  const activeOrigin = useMemo(
    () => origins.find((item) => item.slug === originSlug),
    [origins, originSlug],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch("/api/character/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, race: originSlug }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Karakter oluşturulamadı.");
    } else {
      setSuccess("Karakter oluşturuldu!");
      router.push("/character");
    }
  };

  return (
    <div className="character-create-page">
      <div className="form-box">
        <h2>Karakter Oluştur</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Karakter Adı"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <div className="form-group">
            <label>Köken Seçimi</label>
            {originsLoading ? (
              <p>Milkroad kökenleri getiriliyor...</p>
            ) : originsError ? (
              <p className="error">{originsError}</p>
            ) : (
              <select
                value={originSlug}
                onChange={(event) => setOriginSlug(event.target.value)}
                disabled={origins.length === 0}
              >
                {origins.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {activeOrigin && (
            <div className="origin-details">
              <h3>{activeOrigin.name}</h3>
              <p>{activeOrigin.description}</p>
              {activeOrigin.focus && (
                <p>
                  <strong>Odak:</strong> {activeOrigin.focus}
                </p>
              )}
              {activeOrigin.affinity && (
                <p>
                  <strong>Uyum:</strong> {activeOrigin.affinity}
                </p>
              )}
              {activeOrigin.startingItems.length > 0 && (
                <div className="origin-items">
                  <strong>Başlangıç Eşyaları:</strong>
                  <ul>
                    {activeOrigin.startingItems.map((entry) => (
                      <li
                        key={`${entry.itemId}-${entry.slotIndex ?? "slot"}`}
                      >
                        {entry.item.name} x{entry.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={!originSlug || originsLoading}>
            Oluştur
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default CreateCharacterPage;
