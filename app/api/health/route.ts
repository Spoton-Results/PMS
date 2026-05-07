import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "Vendor Control OS",
    message: "Proof-to-pay control layer is running."
  });
}
