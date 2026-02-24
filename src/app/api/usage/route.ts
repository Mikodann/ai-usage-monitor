import { NextResponse } from "next/server";
import { fetchAllProviders } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = await fetchAllProviders();
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    providers,
  });
}
