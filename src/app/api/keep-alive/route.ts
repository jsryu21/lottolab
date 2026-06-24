import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      status: "skipped",
      reason: "Supabase not configured (local mode)",
    });
  }

  const { error } = await supabase.from("draws").select("drw_no").limit(1);

  if (error) {
    console.error("[keep-alive] Supabase ping failed:", error.message);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  const pingedAt = new Date().toISOString();
  console.log(`[keep-alive] Supabase ping OK at ${pingedAt}`);
  return NextResponse.json({ status: "ok", pingedAt });
}
