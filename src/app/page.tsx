import { createClient } from "@supabase/supabase-js";
import Script from "next/script";
import { LottoDraw, mockLottoDraws } from "@/lib/lotto";
import DashboardClient from "@/components/DashboardClient";

const ADSENSE_CLIENT_ID = "ca-pub-4909104591449651";

// 1시간마다 ISR 갱신 (로또 추첨은 주 1회이므로 충분)
export const revalidate = 3600;

async function fetchInitialDraws(): Promise<LottoDraw[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return mockLottoDraws;

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("drw_no", { ascending: false });

    if (error) return mockLottoDraws;

    if (!data || data.length === 0) {
      // DB가 비어있으면 백그라운드로 크롤링 트리거 (결과 안 기다림)
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      fetch(`${baseUrl}/api/crawl`, { cache: "no-store" }).catch(() => {});
      return mockLottoDraws;
    }

    return data.map((d) => ({
      drwNo: Number(d.drw_no),
      drwNoDate: d.drw_no_date,
      no1: d.no1,
      no2: d.no2,
      no3: d.no3,
      no4: d.no4,
      no5: d.no5,
      no6: d.no6,
      bonusNo: d.bonus_no,
      totSellAmnt: d.tot_sell_amnt ? Number(d.tot_sell_amnt) : undefined,
      firstWinAmnt: d.first_win_amnt ? Number(d.first_win_amnt) : undefined,
      firstPrzWnerCo: d.first_prz_wner_co ? Number(d.first_prz_wner_co) : undefined,
    }));
  } catch {
    return mockLottoDraws;
  }
}

export default async function Page() {
  const initialDraws = await fetchInitialDraws();
  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <DashboardClient initialDraws={initialDraws} />
    </>
  );
}
