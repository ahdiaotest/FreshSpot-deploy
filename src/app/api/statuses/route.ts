import { NextRequest, NextResponse } from "next/server";
import { createStatus, listAllStatusesForFeed, listPlaces } from "@/lib/store";
import type { StatusType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const places = await listPlaces();
  const placeMap = Object.fromEntries(places.map((p) => [p.id, p]));
  const statuses = (await listAllStatusesForFeed()).map((s) => ({
    ...s,
    place: placeMap[s.placeId] ?? null,
  }));
  return NextResponse.json({ statuses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const placeId = String(body.placeId ?? "");
    const statusType = String(body.statusType ?? "") as StatusType;
    const note = String(body.note ?? "");
    const ttlMinutes = body.ttlMinutes
      ? Number(body.ttlMinutes)
      : undefined;

    const allowed: StatusType[] = [
      "sold_out",
      "queue_wait",
      "open_slots",
      "custom",
    ];
    if (!placeId || !allowed.includes(statusType)) {
      return NextResponse.json(
        { error: "placeId and valid statusType required" },
        { status: 400 }
      );
    }
    if (statusType === "custom" && !note.trim()) {
      return NextResponse.json(
        { error: "Custom status needs a note" },
        { status: 400 }
      );
    }

    const report = await createStatus({
      placeId,
      statusType,
      note: note || defaultNote(statusType),
      ttlMinutes,
    });
    return NextResponse.json({ status: report }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 400 }
    );
  }
}

function defaultNote(t: StatusType): string {
  switch (t) {
    case "sold_out":
      return "Sold out / 售罄";
    case "queue_wait":
      return "Queue wait / 排队中";
    case "open_slots":
      return "Open slots / 有空位";
    default:
      return "";
  }
}
