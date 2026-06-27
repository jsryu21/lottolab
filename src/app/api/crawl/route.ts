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

    // 3. 단일 회차 조회 (예: /api/crawl?drwNo=1120)
    const paramDrwNo = req.nextUrl.searchParams.get("drwNo");
    if (paramDrwNo) {
      const drwNo = parseInt(paramDrwNo, 10);
      if (isNaN(drwNo)) return NextResponse.json({ error: "Invalid drwNo" }, { status: 400 });
      const drawData = await fetchDrawFromAPI(drwNo);
      if (!drawData) return NextResponse.json({ error: `회차 ${drwNo} 데이터를 가져오지 못했습니다.` }, { status: 404 });
      await saveDrawToDB(drawData);
      return NextResponse.json({ success: true, crawled: [drwNo] });
    }

    // 4. 범위 지정 Bulk 수집 (예: /api/crawl?from=1&to=100)
    const paramFrom = req.nextUrl.searchParams.get("from");
    const paramTo = req.nextUrl.searchParams.get("to");
    if (paramFrom && paramTo) {
      const fromNo = parseInt(paramFrom, 10);
      const toNo = parseInt(paramTo, 10);
      if (isNaN(fromNo) || isNaN(toNo) || fromNo > toNo) {
        return NextResponse.json({ error: "Invalid from/to range" }, { status: 400 });
      }
      const maxBulk = parseInt(process.env.CRAWL_BATCH_SIZE ?? "50", 10);
      const rangeSize = Math.min(toNo - fromNo + 1, maxBulk);
      const crawledBulk: number[] = [];
      for (let no = fromNo; no < fromNo + rangeSize; no++) {
        const d = await fetchDrawFromAPI(no);
        if (!d) break;
        await saveDrawToDB(d);
        crawledBulk.push(no);
        await new Promise((r) => setTimeout(r, 200));
      }
      return NextResponse.json({ success: true, crawledCount: crawledBulk.length, crawledRange: `${crawledBulk[0]}~${crawledBulk.at(-1)}` });
    }

    // 5. 배치 자동 크롤링 (DB의 최신 회차 다음부터 batchSize만큼 수집)
    const { data: latestDrawInDb } = await supabase
      .from("draws")
      .select("drw_no")
      .order("drw_no", { ascending: false })
      .limit(1);

    let startDrwNo = 1;
    if (latestDrawInDb && latestDrawInDb.length > 0) {
      startDrwNo = latestDrawInDb[0].drw_no + 1;
    }

    const maxBatchSize = parseInt(process.env.CRAWL_BATCH_SIZE ?? "25", 10);
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

    // 신규 데이터가 없어도 SELECT 쿼리로 Supabase 활성 상태 유지
    if (crawledDrwNos.length === 0) {
      await supabase.from("draws").select("drw_no").limit(1);
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
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": "https://www.dhlottery.co.kr/gameInfo.do?method=lottoBuyInfo",
          "X-Requested-With": "XMLHttpRequest",
        },
        redirect: "follow",
      }
    );

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json") && !contentType.includes("javascript")) return null;

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
