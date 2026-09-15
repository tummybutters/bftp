import { NextResponse } from "next/server";
import { getRepairCredit, REPAIR_CREDIT_POLICY } from "@/lib/repair-credit";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 2000)
      return NextResponse.json({ available: false }, { status: 413 });
    const input = JSON.parse(raw);
    const cents = getRepairCredit(
      input?.service,
      input?.property,
      input?.device_count,
    );
    return NextResponse.json(
      {
        available: cents !== null,
        repair_credit_cents: cents,
        policy_version: REPAIR_CREDIT_POLICY,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ available: false }, { status: 400 });
  }
}
