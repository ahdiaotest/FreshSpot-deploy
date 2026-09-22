export type Category =
  | "food"
  | "dessert"
  | "carwash"
  | "massage"
  | "cafe"
  | "other";

export type StatusType = "sold_out" | "queue_wait" | "open_slots" | "custom";

export type Place = {
  id: string;
  name: string;
  nameCn: string;
  category: Category;
  area: string;
};

export type StatusReport = {
  id: string;
  placeId: string;
  statusType: StatusType;
  note: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
};

export type VoucherStatus = "open" | "claimed";

export type Voucher = {
  id: string;
  merchant: string;
  code: string;
  note: string;
  expiry: string | null; // ISO date or null
  status: VoucherStatus;
  createdAt: string;
  claimedAt: string | null;
};

export type Db = {
  places: Place[];
  statuses: StatusReport[];
  vouchers: Voucher[];
};

export const CATEGORY_LABELS: Record<
  Category | "all",
  { en: string; cn: string }
> = {
  all: { en: "All", cn: "全部" },
  food: { en: "Food", cn: "美食" },
  dessert: { en: "Dessert", cn: "甜品" },
  carwash: { en: "Car Wash", cn: "洗车" },
  massage: { en: "Massage", cn: "按摩" },
  cafe: { en: "Cafe", cn: "咖啡" },
  other: { en: "Other", cn: "其他" },
};

export const STATUS_LABELS: Record<StatusType, { en: string; cn: string; emoji: string }> = {
  sold_out: { en: "Sold Out", cn: "售罄", emoji: "🚫" },
  queue_wait: { en: "Queue Wait", cn: "排队中", emoji: "⏳" },
  open_slots: { en: "Open Slots", cn: "有空位", emoji: "✅" },
  custom: { en: "Custom Note", cn: "自定义", emoji: "📝" },
};

export const DEFAULT_TTL_MINUTES = 15;
