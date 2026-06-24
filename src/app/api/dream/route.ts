import { NextRequest, NextResponse } from "next/server";
import { analyzeDream } from "@/lib/gemini";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { dreamText, userId } = await req.json();

    if (!dreamText || typeof dreamText !== "string") {
      return NextResponse.json({ error: "꿈 내용을 입력해 주세요." }, { status: 400 });
    }

    const result = await analyzeDream(dreamText);

    // 로그인 사용자이고 Supabase 연결된 경우 dream_logs에 자동 저장
    if (userId && isSupabaseConfigured) {
      await supabase.from("dream_logs").insert({
        user_id: userId,
        dream_text: dreamText,
        interpretation: result.interpretation,
        keywords: result.keywords,
        numbers: result.numbers,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Dream Router Error:", error);
    return NextResponse.json({ error: "꿈 해몽 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
