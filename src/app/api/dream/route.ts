import { NextRequest, NextResponse } from "next/server";
import { analyzeDream } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { dreamText } = await req.json();
    
    if (!dreamText || typeof dreamText !== "string") {
      return NextResponse.json(
        { error: "꿈 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const result = await analyzeDream(dreamText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Dream Router Error:", error);
    return NextResponse.json(
      { error: "꿈 해몽 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
