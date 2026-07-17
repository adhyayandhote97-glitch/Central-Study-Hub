import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createStudyTip, listStudyTips } from "@/lib/db/study-tips";
import { studyTipInputSchema } from "@/lib/validation/homepageSchema";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    const all = session.role === "admin" && request.nextUrl.searchParams.get("all") === "true";
    const tips = await listStudyTips({ activeOnly: !all });
    return NextResponse.json({ tips });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load study tips.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const json = await request.json().catch(() => null);
    const parsed = studyTipInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    return NextResponse.json({ tip: await createStudyTip(parsed.data) }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create study tip.");
  }
}
