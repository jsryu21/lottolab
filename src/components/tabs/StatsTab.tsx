"use client";

import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { LottoDraw } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";
import LoginGateCard from "@/components/LoginGateCard";

interface StatsData {
  topNumbers: { num: number; count: number }[];
  bottomNumbers: { num: number; count: number }[];
  oddPct: number;
  evenPct: number;
}

interface StatsTabProps {
  user: { id: string; email: string } | null;
  draws: LottoDraw[];
  statsData: StatsData;
  isUsingMockData: boolean;
  isFetchingDraws: boolean;
  onLoginGate: () => void;
}

export default function StatsTab({ user, draws, statsData, isUsingMockData, isFetchingDraws, onLoginGate }: StatsTabProps) {
  if (!user) {
    return <LoginGateCard tab="stats" onLogin={onLoginGate} />;
  }

  return (
    <div className="space-y-6">
      {/* 데이터 기준 안내 배너 */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs ${
        isUsingMockData
          ? "bg-amber-950/40 border-amber-800/50 text-amber-400"
          : "bg-slate-900/50 border-slate-800 text-slate-500"
      }`}>
        <span>
          {isUsingMockData
            ? "⚠ DB 데이터가 없어 임시 샘플 데이터를 표시 중입니다. 실제 통계는 크롤링 완료 후 자동 반영됩니다."
            : `데이터 기준: 제${draws[0]?.drwNo ?? 0}회차 (${draws[draws.length - 1]?.drwNo ?? 0}회차 ~ ${draws[0]?.drwNo ?? 0}회차, 총 ${draws.length}회차)`}
        </span>
        {isFetchingDraws && <span className="text-blue-400 animate-pulse ml-2">갱신 중...</span>}
      </div>

      {/* 최근 당첨 회차 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 1회차 헤드라인 */}
        <div className="lg:col-span-1 bg-gradient-to-b from-blue-950/40 to-slate-900/50 border border-blue-900/20 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-md">
          <div>
            <span className="text-[10px] font-extrabold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-900/60 inline-block mb-2 uppercase">
              LATEST DRAW
            </span>
            <h3 className="font-extrabold text-xl mb-1 text-slate-100">
              제 {draws[0]?.drwNo || "0000"}회 당첨 결과
            </h3>
            <p className="text-xs text-slate-400">추첨일: {draws[0]?.drwNoDate || "2000-01-01"}</p>
          </div>

          <div className="flex items-center gap-1.5 my-3">
            {[draws[0]?.no1, draws[0]?.no2, draws[0]?.no3, draws[0]?.no4, draws[0]?.no5, draws[0]?.no6].map((num, idx) => (
              <span
                key={idx}
                className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${
                  num ? getLottoBallColor(num) : "bg-slate-800 text-slate-500 border-slate-700"
                }`}
              >
                {num}
              </span>
            ))}
            <span className="text-slate-500 text-xs px-0.5">+</span>
            <span
              className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${
                draws[0]?.bonusNo ? getLottoBallColor(draws[0].bonusNo) : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              {draws[0]?.bonusNo}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <div className="flex justify-between">
              <span>1등 당첨금 (1인당)</span>
              <span className="font-bold text-emerald-400">
                {draws[0]?.firstWinAmnt ? `${(draws[0].firstWinAmnt / 100000000).toFixed(1)}억원` : "집계 전"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>1등 당첨 인원</span>
              <span className="font-bold text-slate-200">
                {draws[0]?.firstPrzWnerCo ? `${draws[0].firstPrzWnerCo}명` : "집계 전"}
              </span>
            </div>
          </div>
        </div>

        {/* 과거 회차 리스트 */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400">최근 당첨 회차 이력 (최대 10회)</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-800/60 pr-2">
            {draws.slice(0, 10).map((draw) => (
              <div key={draw.drwNo} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 w-16">{draw.drwNo}회차</span>
                <div className="flex items-center gap-1">
                  {[draw.no1, draw.no2, draw.no3, draw.no4, draw.no5, draw.no6].map((num, idx) => (
                    <span key={idx} className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center ${getLottoBallColor(num)}`}>
                      {num}
                    </span>
                  ))}
                  <span className="text-[9px] text-slate-600 px-0.5">+</span>
                  <span className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center ${getLottoBallColor(draw.bonusNo)}`}>
                    {draw.bonusNo}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{draw.drwNoDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 지표 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 최빈 번호 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            많이 출현한 번호 (TOP 10)
          </h3>
          <div className="grid grid-cols-5 gap-2.5">
            {statsData.topNumbers.map((item) => (
              <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-900">
                <span className={`w-6 h-6 rounded-full border text-[9px] font-extrabold flex items-center justify-center ${getLottoBallColor(item.num)}`}>
                  {item.num}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{item.count}회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 최저빈 번호 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            적게 출현한 번호 (LAST 10)
          </h3>
          <div className="grid grid-cols-5 gap-2.5">
            {statsData.bottomNumbers.map((item) => (
              <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-900">
                <span className={`w-6 h-6 rounded-full border text-[9px] font-extrabold flex items-center justify-center ${getLottoBallColor(item.num)}`}>
                  {item.num}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{item.count}회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 홀짝 통계 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            역대 당첨 번호 홀짝 분포
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                <span>홀수 (Odd Numbers)</span>
                <span>{statsData.oddPct}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${statsData.oddPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                <span>짝수 (Even Numbers)</span>
                <span>{statsData.evenPct}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${statsData.evenPct}%` }} />
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 mt-4 text-center">
            * 역대 수집된 당첨 정보 {draws.length}회차의 모든 공 기준 통계
          </div>
        </div>
      </div>
    </div>
  );
}
