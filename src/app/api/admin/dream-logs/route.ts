import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, verifyAdmin } from "@/lib/adminClient";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminSupabase();
  const { data, error } = await db
    .from("dream_logs")
    .select("id, user_id, dream_text, interpretation, keywords, numbers, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // user_id로 이메일 매핑
  const userIds = [...new Set((data ?? []).map((d) => d.user_id))];
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    try {
      const { data: u } = await db.auth.admin.getUserById(uid);
      if (u?.user?.email) emailMap[uid] = u.user.email;
    } catch { /* skip */ }
  }

  const logs = (data ?? []).map((d) => ({ ...d, user_email: emailMap[d.user_id] ?? d.user_id }));
  return NextResponse.json({ logs });
}
