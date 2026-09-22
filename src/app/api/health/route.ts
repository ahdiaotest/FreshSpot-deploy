import { NextResponse } from "next/server";
import { getDb, getStoreMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({
      ok: true,
      service: "鲜点 FreshSpot",
      time: new Date().toISOString(),
      store: await getStoreMode(),
      counts: {
        places: db.places.length,
        statuses: db.statuses.length,
        vouchers: db.vouchers.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
