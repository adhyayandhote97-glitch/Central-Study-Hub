import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteStudyTip, updateStudyTip } from "@/lib/db/study-tips";
import { studyTipPatchSchema } from "@/lib/validation/homepageSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = studyTipPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const tip = await updateStudyTip(id, parsed.data);
    if (!tip) return NextResponse.json({ error: "Study tip not found." }, { status: 404 });
    return NextResponse.json({ tip });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update study tip.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const deleted = await deleteStudyTip(id);
    if (!deleted) return NextResponse.json({ error: "Study tip not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete study tip.");
  }
}
