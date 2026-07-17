import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/requireRole";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  return NextResponse.json({ role: session?.role ?? null });
}
