'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InventoryModal, {
  InventoryItemPayload,
} from "@/components/inventory/InventoryModal";
import SkillModal from "@/components/skills/SkillModal";

type RegionBasics = {
  slug: string;
  name: string;
  type: string;
  description: string;
  ambientTag: string | null;
  levelMin: number | null;
  levelMax: number | null;
};

type RegionFeature = {
  slug: string;
  name: string;
  type: string;
  description: string;
  icon: string | null;
  posX: number | null;
  posY: number | null;
  npc: {
    slug: string;
    name: string;
    title: string | null;
    role: string;
    type: string;
  } | null;
  targetRegion: {
    slug: string;
    name: string;
    type: string;
  } | null;
};

type ItemStatsSummary = {
  phyAtkMin: number | null;
  phyAtkMax: number | null;
  magAtkMin: number | null;
  magAtkMax: number | null;
  attackDistance: number | null;
  attackRate: number | null;
  critical: number | null;
  durability: number | null;
  parryRatio: number | null;
  blockRatio: number | null;
  phyReinforceMin: number | null;
  phyReinforceMax: number | null;
  magReinforceMin: number | null;
  magReinforceMax: number | null;
};

type MagicOptionSummary = {
  key: string;
  label: string;
  value: string;
};

type ShopListing = {
  id: number;
  itemId: number;
  price: number;
  currency: string;
  stock: number | null;
  item: {
    id: number;
    slug: string | null;
    name: string;
    type: string;
    rarity: string | null;
    icon: string | null;
    description: string | null;
    equipmentSlot: string | null;
    handsRequired: number;
    levelRequirement: number | null;
    degree: number | null;
    magicOptionLimit: number | null;
    upgradeLevel: number;
    magicOptions: MagicOptionSummary[];
    stats: ItemStatsSummary | null;
  };
};

type RegionNpc = {
  id: number;
  slug: string;
  name: string;
  title: string | null;
  role: string;
  type: string;
  description: string;
  shopListings: ShopListing[];
};

type RegionTravelFrom = {
  description: string;
  travelTime: number | null;
  requirement: string | null;
  destination: {
    slug: string;
    name: string;
    type: string;
  } | null;
};

type RegionTravelTo = {
  description: string;
  travelTime: number | null;
  requirement: string | null;
  origin: {
    slug: string;
    name: string;
    type: string;
  } | null;
};

type RegionPayload = {
  region: RegionBasics;
  features: RegionFeature[];
  npcs: RegionNpc[];
  travel: {
    from: RegionTravelFrom[];
    to: RegionTravelTo[];
  };
};

type ActiveCharacter =
  | {
      hasCharacter: true;
      selected: true;
      character: {
        id: number;
        name: string;
        level: number;
        race: string;
        exp: number;
        gold: number;
        skillPoints: number;
      };
    }
  | {
      hasCharacter: boolean;
      selected: false;
    };

type ConfirmState =
  | {
      type: "buy";
      npc: RegionNpc;
      listing: ShopListing;
    }
  | {
      type: "sell";
      npc: RegionNpc;
      inventoryItem: InventoryItemPayload;
      saleUnitPrice: number;
    };

type Props = {
  slug: string;
};

const regionTypeMap: Record<string, string> = {
  CITY: "Şehir",
  FIELD: "Arazi",
  DUNGEON: "Zindan",
  HARBOR: "Liman",
  WILDERNESS: "Vahşi Bölge",
};

const STACKABLE_TYPES = new Set(["CONSUMABLE", "MATERIAL"]);
const STACK_LIMIT = 50;

const RegionScreen: React.FC<Props> = ({ slug }) => {
  const [regionData, setRegionData] = useState<RegionPayload | null>(null);
  const [characterData, setCharacterData] = useState<ActiveCharacter | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<"standard" | "vendor">(
    "standard",
  );
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [skillsOpen, setSkillsOpen] = useState(false);

  const [activeVendor, setActiveVendor] = useState<RegionNpc | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyMaxQuantity, setBuyMaxQuantity] = useState(1);
  const [buyStackable, setBuyStackable] = useState(false);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellMaxQuantity, setSellMaxQuantity] = useState(1);
  const [sellStackable, setSellStackable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [regionRes, characterRes] = await Promise.all([
          fetch(`/api/cities/${slug}`),
          fetch(`/api/character/active`),
        ]);

        if (!regionRes.ok) {
          const payload = await regionRes.json().catch(() => null);
          throw new Error(payload?.message ?? "Bölge verisi yüklenemedi.");
        }

        const regionPayload = (await regionRes.json()) as RegionPayload;

        let characterPayload: ActiveCharacter | null = null;
        if (characterRes.ok) {
          characterPayload = (await characterRes.json()) as ActiveCharacter;
        }

        if (!cancelled) {
          setRegionData(regionPayload);
          setCharacterData(characterPayload);
        }
      } catch (loadError) {
        console.error("Region screen load error:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Veriler yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const region = regionData?.region ?? null;
  const character =
    characterData && "character" in characterData
      ? characterData.character
      : null;

  const friendlyRegionType = region
    ? regionTypeMap[region.type] ?? region.type
    : "";

  const vendorNpcs = useMemo(
    () =>
      regionData?.npcs.filter((npc) => npc.shopListings.length > 0) ?? [],
    [regionData],
  );

  const travelLinks = useMemo(() => {
    if (!regionData) return [];
    return [...regionData.travel.from, ...regionData.travel.to];
  }, [regionData]);

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3000);
  };

  const resetVendorState = () => {
    setActiveVendor(null);
    setInventoryMode("standard");
    setConfirmState(null);
    setBuyQuantity(1);
    setBuyMaxQuantity(1);
    setBuyStackable(false);
  };

  const handleOpenInventory = (mode: "standard" | "vendor" = "standard") => {
    setInventoryMode(mode);
    setInventoryOpen(true);
  };

  const handleOpenSkills = () => {
    setSkillsOpen(true);
  };

  const handleCloseSkills = () => {
    setSkillsOpen(false);
  };

  const handleCloseInventory = () => {
    setInventoryOpen(false);
    if (inventoryMode === "vendor") {
      resetVendorState();
    }
  };

  const handleOpenVendor = (npc: RegionNpc) => {
    setActiveVendor(npc);
    handleOpenInventory("vendor");
  };

  const handleCloseVendor = () => {
    resetVendorState();
    setInventoryOpen(false);
  };

  const handleInventoryUpdate = useCallback((gold: number) => {
    setCharacterData((prev) => {
      if (prev && "character" in prev) {
        return {
          ...prev,
          character: { ...prev.character, gold },
        };
      }
      return prev;
    });
  }, []);

  const handleSkillPointsChange = useCallback((nextSkillPoints: number) => {
    setCharacterData((prev) => {
      if (prev && "character" in prev) {
        return {
          ...prev,
          character: { ...prev.character, skillPoints: nextSkillPoints },
        };
      }
      return prev;
    });
  }, []);

  const computeSalePrice = (
    npc: RegionNpc,
    item: InventoryItemPayload,
    quantity = 1,
  ): number => {
    const listing = npc.shopListings.find(
      (entry) => entry.itemId === item.item.id,
    );
    const basePrice = listing?.price ?? 1;
    const unit = Math.max(1, Math.floor((basePrice * 2) / 3));
    return unit * Math.max(1, quantity);
  };

  const resetTradeState = () => {
    setConfirmState(null);
    setBuyQuantity(1);
    setBuyStackable(false);
    setBuyMaxQuantity(1);
    setSellQuantity(1);
    setSellStackable(false);
    setSellMaxQuantity(1);
  };

  const handleRequestSell = (inventoryItem: InventoryItemPayload) => {
    if (!activeVendor) {
      showNotification("Önce bir NPC mağazasını açmalısınız.");
      return;
    }

    const isStackable = STACKABLE_TYPES.has(inventoryItem.item.type);
    const maxQuantity = isStackable
      ? Math.max(1, Math.min(STACK_LIMIT, inventoryItem.quantity))
      : 1;

    setSellStackable(isStackable);
    setSellMaxQuantity(maxQuantity);
    setSellQuantity(isStackable ? 1 : 1);
    setBuyStackable(false);
    setBuyQuantity(1);
    setBuyMaxQuantity(1);

    const saleUnitPrice = computeSalePrice(activeVendor, inventoryItem, 1);
    setConfirmState({
      type: "sell",
      npc: activeVendor,
      inventoryItem,
      saleUnitPrice,
    });
  };

  const handleRequestBuy = (listingId: number) => {
    if (!activeVendor) return;
    const listing = activeVendor.shopListings.find(
      (entry) => entry.id === listingId,
    );
    if (!listing) {
      showNotification("Ürün artık mevcut değil.");
      return;
    }
    if (listing.stock !== null && listing.stock <= 0) {
      showNotification("Ürün stokta kalmamış.");
      return;
    }

    if (
      character &&
      listing.item.levelRequirement !== null &&
      listing.item.levelRequirement > character.level
    ) {
      showNotification(
        `Bu eşyayı satın almak için seviye ${listing.item.levelRequirement} gerekiyor.`,
      );
      return;
    }

    const isStackable = STACKABLE_TYPES.has(listing.item.type);
    const maxQuantity = Math.min(
      STACK_LIMIT,
      listing.stock !== null ? listing.stock : STACK_LIMIT,
    );

    setBuyStackable(isStackable);
    setBuyMaxQuantity(isStackable ? Math.max(1, maxQuantity) : 1);
    setBuyQuantity(1);
    setSellStackable(false);
    setSellQuantity(1);
    setSellMaxQuantity(1);

    setConfirmState({
      type: "buy",
      npc: activeVendor,
      listing,
    });
  };

  const confirmPurchase = async () => {
    if (!confirmState || confirmState.type !== "buy" || !character) return;

    const quantity = buyStackable ? buyQuantity : 1;

    try {
      const response = await fetch(
        `/api/character/${character.id}/shop/purchase`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "buy",
            listingId: confirmState.listing.id,
            quantity,
          }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Satın alma başarısız.");
      }

      setRegionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          npcs: prev.npcs.map((npc) =>
            npc.id === confirmState.npc.id
              ? {
                  ...npc,
                  shopListings: npc.shopListings.map((listing) =>
                    listing.id === confirmState.listing.id
                      ? {
                          ...listing,
                          stock:
                            listing.stock === null
                              ? null
                              : Math.max(0, listing.stock - quantity),
                        }
                      : listing,
                  ),
                }
              : npc,
          ),
        };
      });

      setInventoryRefreshKey((prev) => prev + 1);
      setCharacterData((prev) => {
        if (prev && "character" in prev && payload?.characterGold !== undefined) {
          return {
            ...prev,
            character: { ...prev.character, gold: payload.characterGold },
          };
        }
        return prev;
      });

      resetTradeState();
      showNotification(
        `${confirmState.listing.item.name} x${quantity} satın alındı.`,
      );
    } catch (err) {
      console.error("Purchase failed:", err);
      showNotification(
        err instanceof Error
          ? err.message
          : "Satın alma sırasında hata oluştu.",
      );
    }
  };

  const confirmSale = async () => {
    if (!confirmState || confirmState.type !== "sell" || !character) return;

    const quantity = sellStackable ? sellQuantity : 1;

    try {
      const response = await fetch(
        `/api/character/${character.id}/shop/purchase`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sell",
            npcId: confirmState.npc.id,
            inventoryItemId: confirmState.inventoryItem.id,
            quantity,
          }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Satış gerçekleştirilemedi.");
      }

      setInventoryRefreshKey((prev) => prev + 1);
      setCharacterData((prev) => {
        if (prev && "character" in prev && payload?.characterGold !== undefined) {
          return {
            ...prev,
            character: { ...prev.character, gold: payload.characterGold },
          };
        }
        return prev;
      });

      const fallbackSaleAmount =
        confirmState.saleUnitPrice * Math.max(1, quantity);
      resetTradeState();
      showNotification(
        `${confirmState.inventoryItem.item.name} x${Math.max(
          1,
          quantity,
        )} satıldı (+${payload?.saleAmount ?? fallbackSaleAmount} altın).`,
      );
    } catch (err) {
      console.error("Sell failed:", err);
      showNotification(
        err instanceof Error
          ? err.message
          : "Satış sırasında bir hata oluştu.",
      );
    }
  };

  if (loading) {
    return (
      <div className="region-screen region-screen--loading">
        <p>Şehir yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="region-screen region-screen--error">
        <p>{error}</p>
        <Link href="/character" className="region-button">
          Sığınağa Dön
        </Link>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="region-screen region-screen--error">
        <p>Bölge verisi bulunamadı.</p>
        <Link href="/character" className="region-button">
          Sığınağa Dön
        </Link>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="region-screen region-screen--error">
        <p>Aktif karakter bulunamadı. Lütfen karakter seçin.</p>
        <Link href="/character" className="region-button">
          Karakter Seç
        </Link>
      </div>
    );
  }

  return (
    <div className="region-screen">
      {notification && <div className="region-toast">{notification}</div>}

      {confirmState && (
        <div className="region-dialog">
          <div className="region-dialog__content">
            <h3>
              {confirmState.type === "buy"
                ? "Satın alma onayı"
                : "Satış onayı"}
            </h3>
            <p>
              {confirmState.type === "buy"
                ? `${confirmState.npc.name} mağazasından ${confirmState.listing.item.name} satın almak istediğinize emin misiniz?`
                : `${confirmState.inventoryItem.item.name} eşyasını ${confirmState.npc.name}'ya satmak istiyor musunuz?`}
            </p>
            {confirmState.type === "buy" && buyStackable ? (
              <div className="region-quantity">
                <button
                  type="button"
                  className="region-quantity__btn"
                  onClick={() =>
                    setBuyQuantity((value) => Math.max(1, value - 1))
                  }
                  disabled={buyQuantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={buyMaxQuantity}
                  value={buyQuantity}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    if (Number.isNaN(next)) {
                      setBuyQuantity(1);
                      return;
                    }
                    setBuyQuantity(
                      Math.min(buyMaxQuantity, Math.max(1, next)),
                    );
                  }}
                />
                <button
                  type="button"
                  className="region-quantity__btn"
                  onClick={() =>
                    setBuyQuantity((value) =>
                      Math.min(buyMaxQuantity, value + 1),
                    )
                  }
                  disabled={buyQuantity >= buyMaxQuantity}
                >
                  +
                </button>
              </div>
            ) : null}
            {confirmState.type === "sell" && sellStackable ? (
              <div className="region-quantity">
                <button
                  type="button"
                  className="region-quantity__btn"
                  onClick={() =>
                    setSellQuantity((value) => Math.max(1, value - 1))
                  }
                  disabled={sellQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={sellMaxQuantity}
                  value={sellQuantity}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    if (Number.isNaN(next)) {
                      setSellQuantity(1);
                      return;
                    }
                    setSellQuantity(
                      Math.min(sellMaxQuantity, Math.max(1, next)),
                    );
                  }}
                />
                <button
                  type="button"
                  className="region-quantity__btn"
                  onClick={() =>
                    setSellQuantity((value) =>
                      Math.min(sellMaxQuantity, value + 1),
                    )
                  }
                  disabled={sellQuantity >= sellMaxQuantity}
                >
                  +
                </button>
              </div>
            ) : null}
            <p className="region-dialog__price">
              {confirmState.type === "buy"
                ? `Fiyat: ${
                    confirmState.listing.price *
                    (buyStackable ? buyQuantity : 1)
                  } altın`
                : `Satış bedeli: ${
                    confirmState.saleUnitPrice *
                    (sellStackable ? sellQuantity : 1)
                  } altın`}
            </p>
            <div className="region-dialog__actions">
              <button
                type="button"
                className="region-button"
                onClick={resetTradeState}
              >
                Hayır
              </button>
              <button
                type="button"
                className="region-button region-button--primary"
                onClick={
                  confirmState.type === "buy" ? confirmPurchase : confirmSale
                }
              >
                Evet
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="region-hud">
        <div className="region-hud__character">
          <h1>{character.name}</h1>
          <div className="region-hud__bars">
            <div className="region-hud__bar region-hud__bar--hp">
              <span>HP</span>
              <div className="region-hud__bar-fill" style={{ width: "100%" }} />
            </div>
            <div className="region-hud__bar region-hud__bar--mp">
              <span>MP</span>
              <div className="region-hud__bar-fill" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="region-hud__stats">
            <span>Seviye {character.level}</span>
            <span>Altın {character.gold}</span>
            <span>Yetenek Puanı {character.skillPoints ?? 0}</span>
          </div>
        </div>

        <div className="region-hud__map">
          <div className="region-hud__map-ring">
            <span>{region.name}</span>
            <small>{friendlyRegionType}</small>
          </div>
          <div className="region-hud__coords">
            <span>Koordinat</span>
            <strong>X: 120 · Y: 87</strong>
          </div>
        </div>

        <div className="region-hud__actions">
          <button
            type="button"
            className="region-button region-button--primary"
            onClick={() => handleOpenInventory("standard")}
          >
            Envanteri Aç
          </button>
          <button
            type="button"
            className="region-button"
            onClick={handleOpenSkills}
          >
            Yetenekler
          </button>
          {activeVendor ? (
            <button
              type="button"
              className="region-button"
              onClick={handleCloseVendor}
            >
              Mağazayı Kapat
            </button>
          ) : null}
        </div>
      </header>

      <main className="region-layout">
        <section className="region-panel region-panel--overview">
          <h2>{region.name}</h2>
          <p>{region.description}</p>
          <div className="region-overview__meta">
            <span>Atmosfer: {region.ambientTag ?? "Bilinmiyor"}</span>
            <span>
              Seviye: {region.levelMin ?? 1} - {region.levelMax ?? "?"}
            </span>
          </div>
        </section>

        <section className="region-panel region-panel--npcs">
          <div className="region-panel__header">
            <h3>NPC Mağazaları</h3>
            <span>Mağaza açmak için butona tıklayın.</span>
          </div>

          <div className="region-vendor-grid">
            {vendorNpcs.map((npc) => {
              const isActive = activeVendor?.id === npc.id;
              return (
                <article key={npc.slug} className="region-vendor-card">
                  <header>
                    <h4>{npc.name}</h4>
                    {npc.title && <small>{npc.title}</small>}
                  </header>
                  <p>{npc.description}</p>
                  <div className="region-vendor-card__actions">
                    <button
                      type="button"
                      className="region-button region-button--secondary"
                      onClick={() =>
                        isActive ? handleCloseVendor() : handleOpenVendor(npc)
                      }
                    >
                      {isActive ? "Mağazayı Kapat" : "Mağazayı Aç"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="region-panel region-panel--features">
          <h3>Şehir Noktaları</h3>
          <ul>
            {regionData?.features.map((feature) => (
              <li key={feature.slug}>
                <div className="region-feature">
                  <div>
                    <strong>{feature.name}</strong>
                    <span>{feature.description}</span>
                  </div>
                  {feature.targetRegion && (
                    <Link
                      href={`/cities/${feature.targetRegion.slug}`}
                      className="region-button region-button--link"
                    >
                      {feature.targetRegion.name}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="region-panel region-panel--travel">
          <h3>Seyahat Rotaları</h3>
          <ul>
            {travelLinks.map((entry, index) => (
              <li key={index}>
                <div className="region-travel">
                  <span>{entry.description}</span>
                  <div className="region-travel__meta">
                    {entry.destination && (
                      <Link
                        href={`/cities/${entry.destination.slug}`}
                        className="region-button region-button--link"
                      >
                        {entry.destination.name}
                      </Link>
                    )}
                    {entry.origin && (
                      <Link
                        href={`/cities/${entry.origin.slug}`}
                        className="region-button region-button--link"
                      >
                        {entry.origin.name}
                      </Link>
                    )}
                    {entry.travelTime !== null && (
                      <span>Süre: {entry.travelTime} saat</span>
                    )}
                    {entry.requirement && <span>Şart: {entry.requirement}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="region-footer">
        <div className="region-footer__exp">
          <span>EXP {character.exp.toLocaleString()}</span>
          <div className="region-footer__exp-bar">
            <div
              className="region-footer__exp-fill"
              style={{ width: "35%" }}
            />
          </div>
        </div>
        <div className="region-footer__skills">
          {Array.from({ length: 10 }).map((_, index) => (
            <button type="button" key={index} className="region-skill-slot">
              {index + 1}
            </button>
          ))}
        </div>
        <div className="region-footer__menu">
          <button type="button" className="region-button">
            Menü
          </button>
          <button type="button" className="region-button">
            Ayarlar
          </button>
        </div>
      </footer>

      {inventoryOpen && (
        <InventoryModal
          characterId={character.id}
          characterName={character.name}
          characterLevel={character.level}
          onClose={handleCloseInventory}
          mode={inventoryMode}
          refreshToken={inventoryRefreshKey}
          onInventoryUpdate={handleInventoryUpdate}
          onRequestSell={handleRequestSell}
          vendor={
            inventoryMode === "vendor" && activeVendor
              ? {
                  npcName: activeVendor.name,
                  listings: activeVendor.shopListings
                    .filter((listing) => {
                      const requiredLevel =
                        listing.item.levelRequirement ?? 1;
                      return !character || requiredLevel <= character.level;
                    })
                    .map((listing) => ({
                      id: listing.id,
                      price: listing.price,
                      stock: listing.stock,
                      item: {
                        id: listing.item.id,
                        slug: listing.item.slug,
                        name: listing.item.name,
                        type: listing.item.type,
                        rarity: listing.item.rarity,
                        icon: listing.item.icon,
                        description: listing.item.description,
                        equipmentSlot: listing.item.equipmentSlot,
                        handsRequired: listing.item.handsRequired,
                        levelRequirement: listing.item.levelRequirement,
                        degree: listing.item.degree,
                        magicOptionLimit: listing.item.magicOptionLimit,
                        upgradeLevel: listing.item.upgradeLevel,
                        magicOptions: listing.item.magicOptions,
                        stats: listing.item.stats,
                      },
                    })),
                  onRequestBuy: (listing) => handleRequestBuy(listing.id),
                }
              : null
          }
        />
      )}

      {skillsOpen && character ? (
        <SkillModal
          characterId={character.id}
          characterName={character.name}
          characterLevel={character.level}
          skillPoints={character.skillPoints ?? 0}
          onClose={handleCloseSkills}
          onSkillPointsChange={handleSkillPointsChange}
        />
      ) : null}
    </div>
  );
};

export default RegionScreen;
