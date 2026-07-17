import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteSubject, getSubjectById, updateSubject } from "@/lib/db/subjects";
import { subjectPatchSchema } from "@/lib/validation/subjectSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["student", "admin"]);
    const { id } = await params;
    const subject = await getSubjectById(id);
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    return NextResponse.json({ subject });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load subject.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = subjectPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const subject = await updateSubject(id, parsed.data);
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    return NextResponse.json({ subject });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update subject.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    await deleteSubject(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete subject.");
  }
}
