import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

// 동행복권 API 타입 정의
interface DonghaengResponse {
  returnValue: string;
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  totSellamnt?: number;
  firstWinamnt?: number;
  firstPrzewnerCo?: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. 크론 작업 보안 검증 (헤더 검사)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = req.nextUrl.searchParams.get("secret");

    // 프로덕션 환경이고 비밀키가 설정되어 있다면 검증 진행 (로컬 테스트는 패스 가능하게 구현)
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }

    // 2. Supabase 연동 상태 확인
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        mode: "local",
        message: "로컬 모드로 작동 중이므로 크롤링 데이터를 저장하지 않습니다.",
      });
    }

    // 3. 특정 회차 조회 파라미터 확인 (예: /api/crawl?drwNo=1120)
    const paramDrwNo = req.nextUrl.searchParams.get("drwNo");
    
    if (paramDrwNo) {
      const drwNo = parseInt(paramDrwNo, 10);
      if (isNaN(drwNo)) {
        return NextResponse.json({ error: "Invalid drwNo" }, { status: 400 });
      }
      
      const drawData = await fetchDrawFromAPI(drwNo);
      if (!drawData) {
        return NextResponse.json({ error: `회차 ${drwNo} 데이터를 가져오지 못했습니다.` }, { status: 404 });
      }
      
      await saveDrawToDB(drawData);
      return NextResponse.json({ success: true, crawled: [drwNo] });
    }

    // 4. 배치 자동 크롤링 (DB의 최신 회차 다음부터 최대 20회차까지 수집)
    // DB의 최대 회차 조회
    const { data: latestDrawInDb } = await supabase
      .from("draws")
      .select("drw_no")
      .order("drw_no", { ascending: false })
      .limit(1);

    // DB에 데이터가 없으면 1회차부터 수집하는 대신, 최근 회차(예: 1100회차) 근처에서 시작하거나 1회차부터 수집합니다.
    // 여기서는 1회차부터 수집하되, 타임아웃 방지를 위해 한 번에 최대 20개씩 수집하게 구현합니다.
    let startDrwNo = 1;
    if (latestDrawInDb && latestDrawInDb.length > 0) {
      startDrwNo = latestDrawInDb[0].drw_no + 1;
    }

    const maxBatchSize = 25;
    const crawledDrwNos: number[] = [];
    
    for (let currentDrwNo = startDrwNo; currentDrwNo < startDrwNo + maxBatchSize; currentDrwNo++) {
      const drawData = await fetchDrawFromAPI(currentDrwNo);
      
      if (!drawData) {
        // 더 이상 최신 데이터가 없으면 중단 (오늘 날짜 이후 회차 등)
        break;
      }
      
      await saveDrawToDB(drawData);
      crawledDrwNos.push(currentDrwNo);
      
      // 동행복권 API 서버 부하 방지를 위해 짧은 대기 시간 부여
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return NextResponse.json({
      success: true,
      crawledCount: crawledDrwNos.length,
      crawledRange: crawledDrwNos.length > 0 
        ? `${crawledDrwNos[0]}회차 ~ ${crawledDrwNos[crawledDrwNos.length - 1]}회차` 
        : "이미 최신 상태입니다.",
      crawledList: crawledDrwNos,
    });
  } catch (error) {
    console.error("API Crawl Error:", error);
    return NextResponse.json(
      { error: "크롤링 작업 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 동행복권 API에서 1개 회차 정보 가져오기
async function fetchDrawFromAPI(drwNo: number): Promise<DonghaengResponse | null> {
  try {
    const res = await fetch(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`,
      {
        next: { revalidate: 3600 }, // 캐시 설정
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      }
    );
    
    if (!res.ok) return null;
    
    const data = (await res.json()) as DonghaengResponse;
    if (data.returnValue !== "success") return null;
    
    return data;
  } catch (error) {
    console.error(`Error fetching draw ${drwNo} from API:`, error);
    return null;
  }
}

// DB에 회차 정보 저장하기
async function saveDrawToDB(data: DonghaengResponse) {
  const { error } = await supabase.from("draws").upsert({
    drw_no: data.drwNo,
    drw_no_date: data.drwNoDate,
    no1: data.drwtNo1,
    no2: data.drwtNo2,
    no3: data.drwtNo3,
    no4: data.drwtNo4,
    no5: data.drwtNo5,
    no6: data.drwtNo6,
    bonus_no: data.bnusNo,
    tot_sell_amnt: data.totSellamnt || null,
    first_win_amnt: data.firstWinamnt || null,
    first_prz_wner_co: data.firstPrzewnerCo || null,
  });

  if (error) {
    throw new Error(`Failed to save draw ${data.drwNo}: ${error.message}`);
  }
}
