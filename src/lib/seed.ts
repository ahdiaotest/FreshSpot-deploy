import type { Db } from "./types";

/** Seed 6–8 JB demo places + sample statuses + vouchers. */
export function buildSeed(): Db {
  const now = Date.now();
  const mins = (m: number) => new Date(now + m * 60_000).toISOString();
  const ago = (m: number) => new Date(now - m * 60_000).toISOString();

  const places = [
    {
      id: "p1",
      name: "Ah Ma Banana Cake",
      nameCn: "阿嬷香蕉糕",
      category: "dessert" as const,
      area: "Taman Molek",
    },
    {
      id: "p2",
      name: "Restoran Lim Bak Kut Teh",
      nameCn: "林记肉骨茶",
      category: "food" as const,
      area: "Jalan Wong Ah Fook",
    },
    {
      id: "p3",
      name: "Sparkle Car Wash",
      nameCn: "闪亮洗车",
      category: "carwash" as const,
      area: "Bukit Indah",
    },
    {
      id: "p4",
      name: "Zen Massage House",
      nameCn: "禅意按摩馆",
      category: "massage" as const,
      area: "Mount Austin",
    },
    {
      id: "p5",
      name: "Kopi Ori Cafe",
      nameCn: "原味咖啡",
      category: "cafe" as const,
      area: "JB Town",
    },
    {
      id: "p6",
      name: "Uncle Ong Char Kway Teow",
      nameCn: "王叔炒粿条",
      category: "food" as const,
      area: "Larkin",
    },
    {
      id: "p7",
      name: "Sweet Bean Dessert",
      nameCn: "甜豆甜品",
      category: "dessert" as const,
      area: "Permas Jaya",
    },
    {
      id: "p8",
      name: "QuickShine Auto Spa",
      nameCn: "快亮汽车护理",
      category: "carwash" as const,
      area: "Skudai",
    },
  ];

  const statuses = [
    {
      id: "s1",
      placeId: "p1",
      statusType: "sold_out" as const,
      note: "Banana cake sold out until tomorrow morning",
      createdAt: ago(5),
      expiresAt: mins(10),
    },
    {
      id: "s2",
      placeId: "p2",
      statusType: "queue_wait" as const,
      note: "~25 min wait, 8 tables ahead",
      createdAt: ago(3),
      expiresAt: mins(12),
    },
    {
      id: "s3",
      placeId: "p4",
      statusType: "open_slots" as const,
      note: "2 therapists free now — walk-in OK",
      createdAt: ago(2),
      expiresAt: mins(13),
    },
    {
      id: "s4",
      placeId: "p3",
      statusType: "queue_wait" as const,
      note: "3 cars in line",
      createdAt: ago(8),
      expiresAt: mins(7),
    },
    {
      id: "s5",
      placeId: "p6",
      statusType: "custom" as const,
      note: "Special: chilli padi version today only",
      createdAt: ago(1),
      expiresAt: mins(14),
    },
  ];

  const vouchers = [
    {
      id: "v1",
      merchant: "Ah Ma Banana Cake",
      code: "BANANA2FREE",
      note: "Buy 1 get 1 free — unused next order",
      expiry: null,
      status: "open" as const,
      createdAt: ago(60),
      claimedAt: null,
    },
    {
      id: "v2",
      merchant: "Sparkle Car Wash",
      code: "WASH20OFF",
      note: "RM20 off exterior wash",
      expiry: mins(60 * 24 * 7),
      status: "open" as const,
      createdAt: ago(120),
      claimedAt: null,
    },
    {
      id: "v3",
      merchant: "Zen Massage House",
      code: "ZEN30",
      note: "30% off 60-min session",
      expiry: mins(60 * 24 * 3),
      status: "open" as const,
      createdAt: ago(30),
      claimedAt: null,
    },
  ];

  return { places, statuses, vouchers };
}
