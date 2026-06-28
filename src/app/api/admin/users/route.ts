import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, verifyAdmin } from "@/lib/adminClient";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminSupabase();
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
  }));

  return NextResponse.json({ users });
}
