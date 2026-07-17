import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteFact, updateFact } from "@/lib/db/daily-facts";
import { dailyFactPatchSchema } from "@/lib/validation/homepageSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = dailyFactPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const fact = await updateFact(id, parsed.data);
    if (!fact) return NextResponse.json({ error: "Fact not found." }, { status: 404 });
    return NextResponse.json({ fact });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update fact.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const deleted = await deleteFact(id);
    if (!deleted) return NextResponse.json({ error: "Fact not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete fact.");
  }
}
