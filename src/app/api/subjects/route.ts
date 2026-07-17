import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createSubject, listSubjects } from "@/lib/db/subjects";
import { subjectInputSchema } from "@/lib/validation/subjectSchema";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["student", "admin"]);
    const subjects = await listSubjects();
    return NextResponse.json({ subjects });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load subjects.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const json = await request.json().catch(() => null);
    const parsed = subjectInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const subject = await createSubject(parsed.data);
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create subject.");
  }
}
