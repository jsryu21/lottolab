import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, verifyAdmin } from "@/lib/adminClient";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminSupabase();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalUsers },
    { count: totalSaves },
    { count: totalDreams },
    { count: todaySaves },
    { count: todayDreams },
    { count: totalNotices },
  ] = await Promise.all([
    db.from("saved_numbers").select("*", { count: "exact", head: true }),
    db.from("saved_numbers").select("*", { count: "exact", head: true }),
    db.from("dream_logs").select("*", { count: "exact", head: true }),
    db.from("saved_numbers").select("*", { count: "exact", head: true }).gte("created_at", today),
    db.from("dream_logs").select("*", { count: "exact", head: true }).gte("created_at", today),
    db.from("notices").select("*", { count: "exact", head: true }),
  ]);

  // auth.users 총 수는 listUsers로 별도 집계
  let authUserCount = 0;
  try {
    const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
    authUserCount = (data as { total?: number })?.total ?? 0;
  } catch { /* service_role 없으면 스킵 */ }

  return NextResponse.json({
    authUserCount,
    totalSaves: totalSaves ?? 0,
    totalDreams: totalDreams ?? 0,
    todaySaves: todaySaves ?? 0,
    todayDreams: todayDreams ?? 0,
    totalNotices: totalNotices ?? 0,
    totalUsers: totalUsers ?? 0,
  });
}
