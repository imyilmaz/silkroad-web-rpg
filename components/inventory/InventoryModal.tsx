'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

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

type EquipmentSlot =
  | "WEAPON_MAIN"
  | "WEAPON_OFF"
  | "HEAD"
  | "SHOULDERS"
  | "CHEST"
  | "GLOVES"
  | "LEGS"
  | "FEET"
  | "NECK"
  | "EARRING"
  | "RING_1"
  | "RING_2"
  | "SPECIAL"
  | "JOB";
type ItemSummary = {
  id: number;
  name: string;
  icon: string | null;
  rarity: string | null;
  type: string;
  equipmentSlot: EquipmentSlot | null;
  handsRequired: number;
  levelRequirement: number | null;
  description: string | null;
  stats: ItemStatsSummary | null;
};

export type InventoryItemPayload = {
  id: number;
  slotIndex: number;
  quantity: number;
  item: ItemSummary;
};

type EquipmentEntry = {
  slot: EquipmentSlot;
  inventoryItemId: number | null;
  item: ItemSummary | null;
};

type InventoryResponse = {
  capacity: number;
  gold: number;
  items: InventoryItemPayload[];
  equipment: EquipmentEntry[];
};

type VendorListing = {
  id: number;
  price: number;
  stock: number | null;
  item: {
    name: string;
    type: string;
    rarity: string | null;
    icon: string | null;
    description: string | null;
  };
};

type VendorInfo = {
  npcName: string;
  listings: VendorListing[];
  onRequestBuy: (listing: VendorListing) => void;
};

type SlotMeta = {
  slot: EquipmentSlot;
  label: string;
};

const SLOT_LAYOUT: SlotMeta[][] = [
  [
    { slot: "WEAPON_MAIN", label: "Ana El" },
    { slot: "WEAPON_OFF", label: "Yan El" },
  ],
  [
    { slot: "HEAD", label: "KafalÄ±k" },
    { slot: "SHOULDERS", label: "Omuzluk" },
  ],
  [
    { slot: "CHEST", label: "ÃœstlÃ¼k" },
    { slot: "GLOVES", label: "Kolluk" },
  ],
  [
    { slot: "LEGS", label: "AltlÄ±k" },
    { slot: "FEET", label: "AyakkabÄ±" },
  ],
  [
    { slot: "NECK", label: "Kolye" },
    { slot: "EARRING", label: "KÃ¼pe" },
  ],
  [
    { slot: "RING_1", label: "YÃ¼zÃ¼k" },
    { slot: "RING_2", label: "YÃ¼zÃ¼k" },
  ],
  [
    { slot: "SPECIAL", label: "Ã–zel" },
    { slot: "JOB", label: "Job" },
  ],
];

const slotLabels = new Map<EquipmentSlot, string>(
  SLOT_LAYOUT.flat().map((item) => [item.slot, item.label]),
);

const DEFAULT_ICON = "/assets/no-image.svg";

function resolveIconPath(icon?: string | null) {
  if (!icon) return DEFAULT_ICON;
  const normalized = icon.replace(/\\/g, "/");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("/")) {
    return normalized;
  }
  const trimmed = normalized.replace(/^(\.\/|public\/)/, "");
  return `/assets/${trimmed}`;
}

const STAT_CONFIG: Array<{ key: keyof ItemStatsSummary; label: string }> = [
  { key: "phyAtkMin", label: "Fiziksel Saldýrý Min" },
  { key: "phyAtkMax", label: "Fiziksel Saldýrý Maks" },
  { key: "magAtkMin", label: "Büyü Saldýrý Min" },
  { key: "magAtkMax", label: "Büyü Saldýrý Maks" },
  { key: "attackRate", label: "Saldýrý Hýzý" },
  { key: "attackDistance", label: "Saldýrý Menzili" },
  { key: "critical", label: "Kritik" },
  { key: "parryRatio", label: "Savunma Oraný" },
  { key: "blockRatio", label: "Blok Oraný" },
  { key: "durability", label: "Dayanýklýlýk" },
  { key: "phyReinforceMin", label: "Fiziksel Takviye Min" },
  { key: "phyReinforceMax", label: "Fiziksel Takviye Maks" },
  { key: "magReinforceMin", label: "Büyü Takviye Min" },
  { key: "magReinforceMax", label: "Büyü Takviye Maks" },
];

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
}
type InventoryModalProps = {
  characterId: number;
  characterName: string;
  onClose: () => void;
  mode?: "standard" | "vendor";
  refreshToken?: number | string;
  onInventoryUpdate?: (gold: number) => void;
  onRequestSell?: (item: InventoryItemPayload) => void;
  vendor?: VendorInfo | null;
};

function formatRarity(rarity: string | null) {
  if (!rarity) return "";
  switch (rarity) {
    case "common":
      return "SÄ±radan";
    case "uncommon":
      return "Nadir";
    case "rare":
      return "Ender";
    default:
      return rarity;
  }
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  characterId,
  characterName,
  onClose,
  mode = "standard",
  refreshToken,
  onInventoryUpdate,
  onRequestSell,
  vendor,
}) => {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    left: number;
    top: number;
    content: React.ReactNode;
  } | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);
      try {
        const response = await fetch(
          `/api/character/${characterId}/inventory`,
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Envanter yÃ¼klenemedi.");
        }
        const payload = (await response.json()) as InventoryResponse;
        if (!cancelled) {
          setData(payload);
          onInventoryUpdate?.(payload.gold);
        }
      } catch (loadError) {
        console.error("Inventory load failed:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Envanter bilgisi alÄ±namadÄ±.",
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
  }, [characterId, refreshToken, onInventoryUpdate]);

  const gridSlots = useMemo(() => {
    if (!data) return [];
    const slots: Array<InventoryItemPayload | null> = Array.from(
      { length: data.capacity },
      () => null,
    );
    data.items.forEach((entry) => {
      if (entry.slotIndex >= 0 && entry.slotIndex < slots.length) {
        slots[entry.slotIndex] = entry;
      }
    });
    return slots;
  }, [data]);

  const equipmentMap = useMemo(() => {
    if (!data) return new Map<EquipmentSlot, EquipmentEntry>();
    return new Map(data.equipment.map((entry) => [entry.slot, entry]));
  }, [data]);

  const refreshInventory = (payload: InventoryResponse) => {
    setData(payload);
    onInventoryUpdate?.(payload.gold);
  };

  const handleEquip = async (item: InventoryItemPayload) => {
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(
        `/api/character/${characterId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "equip",
            inventoryItemId: item.id,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? "EÅŸya giydirilemedi.");
        return;
      }

      const payload = (await response.json()) as InventoryResponse;
      refreshInventory(payload);
      setInfo(`${item.item.name} karaktere giydirildi.`);
    } catch (equipError) {
      console.error("Equip failed:", equipError);
      setError(
        equipError instanceof Error
          ? equipError.message
          : "EÅŸya giydirilirken hata oluÅŸtu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(
        `/api/character/${characterId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "unequip",
            slot,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? "Ekipman Ã§Ä±karÄ±lamadÄ±.");
        return;
      }

      const payload = (await response.json()) as InventoryResponse;
      refreshInventory(payload);
      setInfo(`${slotLabels.get(slot) ?? slot} yuvasÄ± boÅŸaltÄ±ldÄ±.`);
    } catch (unequipError) {
      console.error("Unequip failed:", unequipError);
      setError(
        unequipError instanceof Error
          ? unequipError.message
          : "Ekipman Ã§Ä±karÄ±lÄ±rken hata oluÅŸtu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInventoryClick = (slotItem: InventoryItemPayload | null) => {
    if (!slotItem || submitting) return;

    if (mode === "vendor" && vendor) {
      handleHoverEnd();
      onRequestSell?.(slotItem);
      return;
    }

    handleHoverEnd();
    void handleEquip(slotItem);
  };

  const handleVendorClick = (listing: VendorListing) => {
    handleHoverEnd();
    vendor?.onRequestBuy(listing);
  };

  const handleHoverStart = (
    event: React.MouseEvent<HTMLButtonElement>,
    content: React.ReactNode,
  ) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }

    const target = event.currentTarget;
    const modal = target.closest(".inventory-modal") as HTMLElement | null;
    const targetRect = target.getBoundingClientRect();
    const modalRect = modal?.getBoundingClientRect();

    hoverTimer.current = setTimeout(() => {
      if (!modalRect) return;
      const tooltipWidth = 240;
      const tooltipHeight = 160;
      const left = Math.min(
        modalRect.width - tooltipWidth - 12,
        Math.max(12, targetRect.right - modalRect.left + 12),
      );
      const top = Math.min(
        modalRect.height - tooltipHeight - 12,
        Math.max(12, targetRect.top - modalRect.top),
      );
      setTooltip({ left, top, content });
    }, 500);
  };

  const handleHoverEnd = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setTooltip(null);
  };

  useEffect(
    () => () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    setTooltip(null);
  }, [mode, vendor, data]);

  const renderItemTooltip = (item: ItemSummary, quantity?: number) => {
    const statEntries =
      item.stats !== null
        ? STAT_CONFIG.filter(({ key }) => item.stats && item.stats[key] !== null)
        : [];

    return (
      <div className="inventory-tooltip__content">
        <strong>{item.name}</strong>
        {item.rarity && (
          <span className="inventory-tooltip__rarity">
            {formatRarity(item.rarity)}
          </span>
        )}
        <ul className="inventory-tooltip__list">
          <li>Tur: {item.type.toLowerCase()}</li>
          {item.equipmentSlot && (
            <li>Slot: {item.equipmentSlot.toLowerCase()}</li>
          )}
          {item.levelRequirement !== null && item.levelRequirement > 0 && (
            <li>Seviye: {item.levelRequirement}</li>
          )}
          <li>Eller: {item.handsRequired > 1 ? "iki elli" : "tek elli"}</li>
          {quantity !== undefined && <li>Adet: {quantity}</li>}
        </ul>
        {statEntries.length > 0 && (
          <ul className="inventory-tooltip__list inventory-tooltip__list--stats">
            {statEntries.map(({ key, label }) => {
              const formatted = formatNumber(item.stats?.[key]);
              if (!formatted) return null;
              return (
                <li key={key}>
                  {label}: {formatted}
                </li>
              );
            })}
          </ul>
        )}
        {item.description && (
          <p className="inventory-tooltip__description">{item.description}</p>
        )}
      </div>
    );
  };

  const renderVendorTooltip = (listing: VendorListing) => (
    <div className="inventory-tooltip__content">
      <strong>{listing.item.name}</strong>
      {listing.item.rarity && (
        <span className="inventory-tooltip__rarity">
          {formatRarity(listing.item.rarity)}
        </span>
      )}
      <ul className="inventory-tooltip__list">
        <li>Tur: {listing.item.type.toLowerCase()}</li>
        <li>Fiyat: {listing.price} altin</li>
        {listing.stock !== null && <li>Stok: {listing.stock}</li>}
      </ul>
      {listing.item.description && (
        <p className="inventory-tooltip__description">
          {listing.item.description}
        </p>
      )}
    </div>
  );

  const isVendorMode = mode === "vendor" && Boolean(vendor);

  if (loading) {
    return (
      <div className="inventory-modal-backdrop" onClick={onClose}>
        <div className="inventory-modal" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-modal__status">Envanter yÃ¼kleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-modal-backdrop" onClick={onClose}>
      <div
        className="inventory-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="inventory-modal__header">
          <div>
            <h2>
              {characterName} -{" "}
              {isVendorMode && vendor
                ? `${vendor.npcName} MaÄŸazasÄ±`
                : "Envanter"}
            </h2>
            <p>
              Kapasite: {data?.capacity ?? 32} slot Â· AltÄ±n:{" "}
              <strong>{data?.gold ?? 0}</strong>
            </p>
          </div>
          <button
            type="button"
            className="inventory-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            Ã—
          </button>
        </header>

        {error && <div className="inventory-modal__error">{error}</div>}
        {info && <div className="inventory-modal__info">{info}</div>}

        <div className="inventory-modal__content">
          {isVendorMode && vendor ? (
            <section className="inventory-modal__vendor">
              <h3>MaÄŸaza</h3>
              <div className="vendor-grid">
                {vendor.listings.map((listing) => (
                  <button
                    type="button"
                    key={listing.id}
                    className="vendor-slot"
                    style={{
                      backgroundImage: `url('${resolveIconPath(
                        listing.item.icon,
                      )}')`,
                    }}
                    disabled={submitting}
                    onClick={() => handleVendorClick(listing)}
                    onMouseEnter={(event) =>
                      handleHoverStart(event, renderVendorTooltip(listing))
                    }
                    onMouseLeave={handleHoverEnd}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="inventory-modal__grid">
            <h3>Ã‡anta</h3>
            <div className="inventory-grid">
              {gridSlots.map((slotItem, index) => (
                <button
                  type="button"
                  key={index}
                  className={`inventory-slot${
                    slotItem ? " inventory-slot--filled" : " inventory-slot--empty"
                  }${isVendorMode ? " inventory-slot--vendor" : ""}`}
                  style={
                    slotItem
                      ? {
                          backgroundImage: `url('${resolveIconPath(
                            slotItem.item.icon,
                          )}')`,
                        }
                      : undefined
                  }
                  onClick={() => handleInventoryClick(slotItem)}
                  onMouseEnter={(event) =>
                    slotItem
                      ? handleHoverStart(
                          event,
                          renderItemTooltip(slotItem.item, slotItem.quantity),
                        )
                      : undefined
                  }
                  onMouseLeave={handleHoverEnd}
                  disabled={!slotItem || submitting}
                >
                  {slotItem && slotItem.quantity > 1 ? (
                    <span className="inventory-slot__stack">
                      x{slotItem.quantity}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section className="inventory-modal__equipment">
            <h3>Karakter</h3>
            <div className="equipment-panel">
              {SLOT_LAYOUT.map((row) => (
                <div key={row[0].slot} className="equipment-row">
                  {row.map(({ slot, label }) => {
                    const entry = equipmentMap.get(slot);
                    const item = entry?.item ?? null;
                    const pairedSlot =
                      slot === "WEAPON_MAIN"
                        ? equipmentMap.get("WEAPON_OFF")
                        : slot === "WEAPON_OFF"
                          ? equipmentMap.get("WEAPON_MAIN")
                          : null;
                    const isTwoHand =
                      item &&
                      pairedSlot?.item &&
                      pairedSlot.inventoryItemId === entry?.inventoryItemId &&
                      item.handsRequired > 1;

                    return (
                      <button
                        type="button"
                        key={slot}
                        className={`equipment-slot${
                          item ? " equipment-slot--filled" : ""
                        }${isTwoHand ? " equipment-slot--twohand" : ""}`}
                        style={{
                          backgroundImage: `url('${resolveIconPath(
                            item?.icon ?? null,
                          )}')`,
                        }}
                        onClick={() =>
                          item && !submitting ? handleUnequip(slot) : null
                        }
                        onMouseEnter={(event) =>
                          item
                            ? handleHoverStart(event, renderItemTooltip(item))
                            : undefined
                        }
                        onMouseLeave={handleHoverEnd}
                        disabled={!item || submitting}
                      >
                        <span className="equipment-slot__label">{label}</span>
                        {item && isTwoHand && (
                          <span className="equipment-slot__tag">Iki elli</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {tooltip && (
            <div
              className="inventory-tooltip"
              style={{ left: tooltip.left, top: tooltip.top }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
