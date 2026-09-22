import { NextRequest, NextResponse } from "next/server";
import { createVoucher, listVouchers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ vouchers: await listVouchers() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const merchant = String(body.merchant ?? "").trim();
    const code = String(body.code ?? "").trim();
    const note = String(body.note ?? "").trim();
    const expiry = body.expiry ? String(body.expiry) : null;

    if (!merchant || !code) {
      return NextResponse.json(
        { error: "merchant and code required" },
        { status: 400 }
      );
    }

    const voucher = await createVoucher({ merchant, code, note, expiry });
    return NextResponse.json({ voucher }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 400 }
    );
  }
}
