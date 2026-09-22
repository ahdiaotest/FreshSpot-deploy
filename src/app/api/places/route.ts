import { NextResponse } from "next/server";
import { listPlaces } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ places: await listPlaces() });
}
