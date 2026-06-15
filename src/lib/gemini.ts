import { GoogleGenerativeAI } from "@google/generative-ai";
import { presetDreamKeywords, generateRandomSet } from "./lotto";

const apiKey = process.env.GEMINI_API_KEY;

export const isGeminiConfigured = Boolean(apiKey) && apiKey !== "";

const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey!) : null;

export interface DreamAnalysisResult {
  interpretation: string;
  keywords: string[];
  numbers: number[];
  isRealAi: boolean;
}

// 꿈 분석 핵심 로직 (서버사이드 전용)
export async function analyzeDream(dreamText: string): Promise<DreamAnalysisResult> {
  if (!dreamText || dreamText.trim() === "") {
    return {
      interpretation: "꿈 내용을 입력해 주세요.",
      keywords: [],
      numbers: generateRandomSet(),
      isRealAi: false,
    };
  }

  // 1. Gemini API가 설정되어 있고 인스턴스가 존재할 경우
  if (isGeminiConfigured && genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
You are a professional dream interpreter and lottery number analyst.
Analyze the following dream in Korean: "${dreamText}"

Generate a response in JSON format matching this schema:
{
  "interpretation": "A friendly, detailed, and encouraging dream interpretation in Korean (2-3 sentences), explaining how the symbols relate to luck or wealth.",
  "keywords": ["2-3 main keywords extracted from the dream"],
  "numbers": [6 unique lottery numbers between 1 and 45 associated with these dream symbols]
}
Make sure 'numbers' is an array of exactly 6 unique integers sorted in ascending order.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text) as {
        interpretation: string;
        keywords: string[];
        numbers: number[];
      };

      // 숫자 검증 (6개 정렬된 수)
      let numbers = Array.isArray(parsed.numbers) ? parsed.numbers : [];
      numbers = numbers.filter((n) => typeof n === "number" && n >= 1 && n <= 45);
      if (numbers.length < 6) {
        const random = generateRandomSet();
        numbers = [...new Set([...numbers, ...random])].slice(0, 6);
      }
      numbers.sort((a, b) => a - b);

      return {
        interpretation: parsed.interpretation || "행운을 상징하는 좋은 꿈입니다. 추천 번호로 행운을 노려보세요!",
        keywords: parsed.keywords || ["꿈", "행운"],
        numbers,
        isRealAi: true,
      };
    } catch (error) {
      console.error("Gemini Dream Analysis API Error:", error);
      // API 오류 시 Local Fallback으로 진행
    }
  }

  // 2. Local Fallback (Gemini API가 없거나 에러 발생 시)
  // 꿈 텍스트에서 키워드를 파싱하여 매칭되는 번호 결합
  const foundKeywords: string[] = [];
  const matchedNumbers: number[] = [];

  for (const keyword of Object.keys(presetDreamKeywords)) {
    if (dreamText.includes(keyword)) {
      foundKeywords.push(keyword);
      matchedNumbers.push(...presetDreamKeywords[keyword]);
    }
  }

  // 매칭된 숫자가 부족하면 무작위 추가
  let finalNumbers = [...new Set(matchedNumbers)].slice(0, 6);
  if (finalNumbers.length < 6) {
    const random = generateRandomSet();
    finalNumbers = [...new Set([...finalNumbers, ...random])].slice(0, 6);
  }
  finalNumbers.sort((a, b) => a - b);

  const keywordsLabel = foundKeywords.length > 0 ? foundKeywords : ["꿈", "행운"];
  const interpretationText = foundKeywords.length > 0
    ? `꿈에서 언급하신 [${foundKeywords.join(", ")}] 키워드는 로또 분석 데이터베이스에서 강한 행운과 연결된 번호들입니다. 로또랩 전통 매칭 테이블로 분석을 완료했습니다.`
    : "적합한 특정 해몽 키워드를 찾지 못했으나, 오늘 입력하신 꿈의 긍정적인 기운을 받아 새로운 행운의 번호들을 조합해 드립니다.";

  return {
    interpretation: `${interpretationText} (참고: 현재 로컬 매칭 모드로 구동 중입니다.)`,
    keywords: keywordsLabel,
    numbers: finalNumbers,
    isRealAi: false,
  };
}
