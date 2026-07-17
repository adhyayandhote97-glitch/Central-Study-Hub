import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createFact, getFactOfTheDay, listAllFacts } from "@/lib/db/daily-facts";
import { dailyFactInputSchema } from "@/lib/validation/homepageSchema";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    // Admins managing the pool ask for everything; students get today's pick.
    if (session.role === "admin" && request.nextUrl.searchParams.get("all") === "true") {
      return NextResponse.json({ facts: await listAllFacts() });
    }
    return NextResponse.json({ fact: await getFactOfTheDay() });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load facts.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const json = await request.json().catch(() => null);
    const parsed = dailyFactInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    return NextResponse.json({ fact: await createFact(parsed.data) }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create fact.");
  }
}
