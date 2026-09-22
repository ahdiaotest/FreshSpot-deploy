import { NextRequest, NextResponse } from "next/server";
import { claimVoucher } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const voucher = await claimVoucher(params.id);
    return NextResponse.json({ voucher });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    const status = msg === "Already claimed" ? 409 : 404;
    return NextResponse.json({ error: msg }, { status });
  }
}
