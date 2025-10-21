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

type MagicOptionSummary = {
  key: string;
  label: string;
  value: string;
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
  slug: string | null;
  name: string;
  icon: string | null;
  rarity: string | null;
  type: string;
  equipmentSlot: EquipmentSlot | null;
  handsRequired: number;
  levelRequirement: number | null;
  degree: number | null;
  magicOptionLimit: number | null;
  upgradeLevel: number;
  magicOptions: MagicOptionSummary[];
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
  item: ItemSummary;
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
    { slot: "HEAD", label: "Kafalık" },
    { slot: "SHOULDERS", label: "Omuzluk" },
  ],
  [
    { slot: "CHEST", label: "Üstlük" },
    { slot: "GLOVES", label: "Kolluk" },
  ],
  [
    { slot: "LEGS", label: "Altlık" },
    { slot: "FEET", label: "Ayakkabı" },
  ],
  [
    { slot: "NECK", label: "Kolye" },
    { slot: "EARRING", label: "Küpe" },
  ],
  [
    { slot: "RING_1", label: "Yüzük" },
    { slot: "RING_2", label: "Yüzük" },
  ],
  [
    { slot: "SPECIAL", label: "Özel" },
    { slot: "JOB", label: "Job" },
  ],
];

const slotLabels = new Map<EquipmentSlot, string>(
  SLOT_LAYOUT.flat().map((item) => [item.slot, item.label]),
);

const DEFAULT_ICON = "/assets/no-image.svg";

function resolveIconPath(icon?: string | null) {
  if (!icon) return DEFAULT_ICON;
  const normalized = icon.replace(/\\/g, "/").trim();
  if (!normalized) return DEFAULT_ICON;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("/")) {
    return normalized;
  }
  const trimmed = normalized.replace(/^(\.\/|public\/)/, "");
  if (!trimmed) return DEFAULT_ICON;
  if (trimmed.startsWith("assets/")) {
    return `/${trimmed}`;
  }
  return DEFAULT_ICON;
}

function buildSlotBackground(icon?: string | null) {
  const resolved = resolveIconPath(icon);
  if (resolved === DEFAULT_ICON) {
    return `url('${DEFAULT_ICON}')`;
  }
  return `url('${resolved}'), url('${DEFAULT_ICON}')`;
}


function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatValue(
  value: number | null | undefined,
  options: { percent?: boolean } = {},
) {
  if (value === null || value === undefined) return null;
  const scaled =
    options.percent && Math.abs(value) <= 1 ? value * 100 : value;
  const base = formatNumber(scaled);
  if (!base) return null;
  return options.percent ? `${base}%` : base;
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  options: { percent?: boolean } = {},
) {
  const minValue = formatValue(min, options);
  const maxValue = formatValue(max, options);
  if (minValue && maxValue) {
    if (minValue === maxValue) return minValue;
    return `${minValue} - ${maxValue}`;
  }
  return minValue ?? maxValue ?? null;
}

function buildStatLines(stats: ItemStatsSummary | null): string[] {
  if (!stats) return [];
  const lines: string[] = [];

  const physicalAttack = formatRange(stats.phyAtkMin, stats.phyAtkMax);
  if (physicalAttack) {
    lines.push(`Fiziksel Saldırı: ${physicalAttack}`);
  }

  const magicAttack = formatRange(stats.magAtkMin, stats.magAtkMax);
  if (magicAttack) {
    lines.push(`Büyü Saldırısı: ${magicAttack}`);
  }

  const physicalReinforce = formatRange(
    stats.phyReinforceMin,
    stats.phyReinforceMax,
    { percent: true },
  );
  if (physicalReinforce) {
    lines.push(`Fiziksel Takviye: ${physicalReinforce}`);
  }

  const magicReinforce = formatRange(
    stats.magReinforceMin,
    stats.magReinforceMax,
    { percent: true },
  );
  if (magicReinforce) {
    lines.push(`Büyü Takviyesi: ${magicReinforce}`);
  }

  const attackRate = formatValue(stats.attackRate);
  if (attackRate) {
    lines.push(`Saldırı Hızı: ${attackRate}`);
  }

  const attackDistance = formatValue(stats.attackDistance);
  if (attackDistance) {
    lines.push(`Saldırı Menzili: ${attackDistance}`);
  }

  const critical = formatValue(stats.critical, { percent: true });
  if (critical) {
    lines.push(`Kritik: ${critical}`);
  }

  const blockRatio = formatValue(stats.blockRatio, { percent: true });
  if (blockRatio) {
    lines.push(`Blok: ${blockRatio}`);
  }

  const parry = formatValue(stats.parryRatio, { percent: true });
  if (parry) {
    lines.push(`Parry: ${parry}`);
  }

  const durability = formatValue(stats.durability);
  if (durability) {
    lines.push(`Dayanıklılık: ${durability}`);
  }

  return lines;
}

function sanitizeDescription(raw?: string | null): string | null {
  if (!raw) return null;
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/?(font|strong|em|small|smal)[^>]*>/gi, "");
  const withoutTags = normalized.replace(/<[^>]+>/g, "");
  const cleaned = withoutTags
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return cleaned.length > 0 ? cleaned : null;
}
type InventoryModalProps = {
  characterId: number;
  characterName: string;
  characterLevel: number;
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
      return "Sıradan";
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
  characterLevel,
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
  const infoTimer = useRef<number | null>(null);

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
          throw new Error(payload?.message ?? "Envanter yüklenemedi.");
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
              : "Envanter bilgisi alınamadı.",
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
        setError(payload?.message ?? "Eşya giydirilemedi.");
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
          : "Eşya giydirilirken hata oluştu.",
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
        setError(payload?.message ?? "Ekipman çıkarılamadı.");
        return;
      }

      const payload = (await response.json()) as InventoryResponse;
      refreshInventory(payload);
      setInfo(`${slotLabels.get(slot) ?? slot} yuvası boşaltıldı.`);
    } catch (unequipError) {
      console.error("Unequip failed:", unequipError);
      setError(
        unequipError instanceof Error
          ? unequipError.message
          : "Ekipman çıkarılırken hata oluştu.",
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
    if (
      listing.item.levelRequirement !== null &&
      listing.item.levelRequirement > characterLevel
    ) {
      if (infoTimer.current) {
        window.clearTimeout(infoTimer.current);
      }
      const requiredLevel = listing.item.levelRequirement;
      setInfo(`Bu esyayi satin almak icin seviye ${requiredLevel} gerekiyor.`);
      infoTimer.current = window.setTimeout(() => {
        setInfo(null);
        infoTimer.current = null;
      }, 2600);
      return;
    }
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
      if (infoTimer.current !== null) {
        window.clearTimeout(infoTimer.current);
        infoTimer.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    setTooltip(null);
  }, [mode, vendor, data]);

  const renderItemTooltip = (
    item: ItemSummary,
    quantity?: number,
    extra?: { price?: number; stock?: number | null },
  ) => {
    const displayName =
      item.upgradeLevel && item.upgradeLevel > 0
        ? `${item.name} +${item.upgradeLevel}`
        : item.name;
    const slotLabel = item.equipmentSlot
      ? slotLabels.get(item.equipmentSlot) ?? item.equipmentSlot.toLowerCase()
      : null;

    const itemType = item.type ? item.type.toLowerCase() : "bilinmiyor";

    const baseInfo: string[] = [
      `Tür: ${itemType}`,
      slotLabel ? `Slot: ${slotLabel}` : null,
      item.degree !== null ? `Derece: ${item.degree}` : null,
      item.levelRequirement !== null && item.levelRequirement > 0
        ? `Seviye: ${item.levelRequirement}`
        : null,
      `Eller: ${item.handsRequired > 1 ? "İki elli" : "Tek Elli"}`,
      item.magicOptionLimit !== null
        ? `Mavi Slot: ${item.magicOptionLimit}`
        : null,
      quantity !== undefined ? `Adet: ${quantity}` : null,
      extra?.price !== undefined ? `Fiyat: ${extra.price} altın` : null,
      extra?.stock !== undefined && extra.stock !== null
        ? `Stok: ${extra.stock}`
        : null,
    ].filter((value): value is string => Boolean(value));

    const statLines = buildStatLines(item.stats);
    const hasMagicOptions = item.magicOptions.length > 0;
    const sanitizedDescription = sanitizeDescription(item.description);

    return (
      <div className="inventory-tooltip__content">
        <strong>{displayName}</strong>
        {item.rarity && (
          <span className="inventory-tooltip__rarity">
            {formatRarity(item.rarity)}
          </span>
        )}
        <ul className="inventory-tooltip__list">
          {baseInfo.map((line, index) => (
            <li key={`${item.id}-info-${index}`}>{line}</li>
          ))}
        </ul>
        {statLines.length > 0 && (
          <ul className="inventory-tooltip__list inventory-tooltip__list--stats">
            {statLines.map((line, index) => (
              <li key={`${item.id}-stat-${index}`}>{line}</li>
            ))}
          </ul>
        )}
        {hasMagicOptions && (
          <ul className="inventory-tooltip__list inventory-tooltip__list--magic">
            {item.magicOptions.map((option, index) => (
              <li
                key={option.key ?? `${item.id}-magic-${option.label}-${index}`}
                className="inventory-tooltip__magic-line"
              >
                <span className="inventory-tooltip__magic-label">
                  {option.label}
                </span>
                <span className="inventory-tooltip__magic-value">
                  {option.value}
                </span>
              </li>
            ))}
          </ul>
        )}
        {sanitizedDescription && (
          <p className="inventory-tooltip__description">
            {sanitizedDescription.split("\n").map((line, index, array) => (
              <React.Fragment key={`${item.id}-desc-${index}`}>
                {line}
                {index < array.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        )}
      </div>
    );
  };

  const renderVendorTooltip = (listing: VendorListing) =>
    renderItemTooltip(listing.item, undefined, {
      price: listing.price,
      stock: listing.stock,
    });

  const isVendorMode = mode === "vendor" && Boolean(vendor);

  if (loading) {
    return (
      <div className="inventory-modal-backdrop" onClick={onClose}>
        <div className="inventory-modal" onClick={(event) => event.stopPropagation()}>
          <div className="inventory-modal__status">Envanter yükleniyor...</div>
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
                ? `${vendor.npcName} Mağazası`
                : "Envanter"}
            </h2>
            <p>
              Kapasite: {data?.capacity ?? 32} slot · Altın:{" "}
              <strong>{data?.gold ?? 0}</strong>
            </p>
          </div>
          <button
            type="button"
            className="inventory-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </header>

        {error && <div className="inventory-modal__error">{error}</div>}
        {info && <div className="inventory-modal__info">{info}</div>}

        <div className="inventory-modal__content">
          {isVendorMode && vendor ? (
            <section className="inventory-modal__vendor">
              <h3>Mağaza</h3>
              <div className="vendor-grid">
                {vendor.listings.map((listing) => {
                  const isLocked =
                    listing.item.levelRequirement !== null &&
                    listing.item.levelRequirement > characterLevel;

                  return (
                    <button
                      type="button"
                      key={listing.id}
                      className={`vendor-slot${
                        isLocked ? " vendor-slot--locked" : ""
                      }`}
                      style={{
                        backgroundImage: buildSlotBackground(listing.item.icon),
                      }}
                      disabled={submitting || isLocked}
                      onClick={() => {
                        if (isLocked) return;
                        handleVendorClick(listing);
                      }}
                      onMouseEnter={(event) =>
                        handleHoverStart(event, renderVendorTooltip(listing))
                      }
                      onMouseLeave={handleHoverEnd}
                    >
                      {isLocked && listing.item.levelRequirement !== null ? (
                        <span className="vendor-slot__lock">
                          Lv {listing.item.levelRequirement}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="inventory-modal__grid">
            <h3>Çanta</h3>
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
                          backgroundImage: buildSlotBackground(
                            slotItem.item.icon,
                          ),
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
