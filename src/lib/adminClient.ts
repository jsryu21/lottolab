import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function verifyAdmin(req: NextRequest): Promise<{ email: string } | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = createAdminSupabase();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user?.email) return null;
  if (user.email !== process.env.ADMIN_EMAIL) return null;
  return { email: user.email };
}
