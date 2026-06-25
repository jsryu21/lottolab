import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PortOne 웹훅 페이로드 타입
interface PortOneWebhookPayload {
  imp_uid: string;
  merchant_uid: string;
  status: "ready" | "paid" | "failed" | "cancelled";
}

export async function POST(req: NextRequest) {
  try {
    const body: PortOneWebhookPayload = await req.json();
    const { imp_uid, merchant_uid, status } = body;

    if (!imp_uid || !merchant_uid) {
      return NextResponse.json({ error: "Missing imp_uid or merchant_uid" }, { status: 400 });
    }

    // merchant_uid 형식: "lottolab_pro_{userId}_{timestamp}"
    const parts = merchant_uid.split("_");
    const userId = parts.length >= 3 ? parts[2] : null;

    if (!userId) {
      return NextResponse.json({ error: "Cannot parse userId from merchant_uid" }, { status: 400 });
    }

    if (status === "paid") {
      // PortOne API로 결제 금액 검증
      const portoneApiKey = process.env.PORTONE_API_KEY;
      const portoneApiSecret = process.env.PORTONE_API_SECRET;

      if (portoneApiKey && portoneApiSecret) {
        const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imp_key: portoneApiKey, imp_secret: portoneApiSecret }),
        });
        const tokenData = await tokenRes.json();
        const accessToken = tokenData?.response?.access_token;

        if (accessToken) {
          const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: accessToken },
          });
          const paymentData = await paymentRes.json();
          const payment = paymentData?.response;

          if (!payment || payment.status !== "paid" || payment.amount < 990) {
            return NextResponse.json({ error: "Payment validation failed" }, { status: 400 });
          }
        }
      }

      // 30일 연장 (기존 만료일 기준으로 연장하거나 현재 기준)
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("pro_expires_at")
        .eq("id", userId)
        .single();

      const baseDate =
        existing?.pro_expires_at && new Date(existing.pro_expires_at) > new Date()
          ? new Date(existing.pro_expires_at)
          : new Date();

      baseDate.setDate(baseDate.getDate() + 30);

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        is_pro: true,
        pro_expires_at: baseDate.toISOString(),
        updated_at: new Date().toISOString(),
      });

    } else if (status === "failed" || status === "cancelled") {
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        is_pro: false,
        pro_expires_at: null,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[payment/webhook]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
