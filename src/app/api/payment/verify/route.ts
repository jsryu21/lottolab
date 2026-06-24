import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { imp_uid, merchant_uid, userId } = await req.json();

    if (!imp_uid || !merchant_uid || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // PortOne 서버 사이드 영수증 검증
    const portoneApiKey = process.env.PORTONE_API_KEY;
    const portoneApiSecret = process.env.PORTONE_API_SECRET;

    if (portoneApiKey && portoneApiSecret) {
      // 1. PortOne 액세스 토큰 발급
      const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imp_key: portoneApiKey, imp_secret: portoneApiSecret }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData?.response?.access_token;

      if (!accessToken) {
        return NextResponse.json({ error: "PortOne 인증 실패" }, { status: 500 });
      }

      // 2. 결제 정보 조회
      const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
        headers: { Authorization: accessToken },
      });
      const paymentData = await paymentRes.json();
      const payment = paymentData?.response;

      if (!payment || payment.status !== "paid" || payment.amount < 990) {
        return NextResponse.json({ error: "유효하지 않은 결제입니다." }, { status: 400 });
      }
    }

    // DB에 PRO 상태 기록 (30일 만료)
    const proExpiresAt = new Date();
    proExpiresAt.setDate(proExpiresAt.getDate() + 30);

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, is_pro: true, pro_expires_at: proExpiresAt.toISOString(), updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: "DB 업데이트 실패: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, proExpiresAt: proExpiresAt.toISOString() });
  } catch (err) {
    console.error("[payment/verify]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
