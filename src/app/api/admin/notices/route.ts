import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, verifyAdmin } from "@/lib/adminClient";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminSupabase();
  const { data, error } = await db.from("notices").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notices: data });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json() as { title: string; content: string };
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });

  const db = createAdminSupabase();
  const { data, error } = await db.from("notices").insert({ title, content, is_active: true }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notice: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, is_active, title, content } = await req.json() as { id: string; is_active?: boolean; title?: string; content?: string };
  const db = createAdminSupabase();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (is_active !== undefined) updates.is_active = is_active;
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const { error } = await db.from("notices").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  const db = createAdminSupabase();
  const { error } = await db.from("notices").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
