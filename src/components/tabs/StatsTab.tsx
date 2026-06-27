"use client";

import { TrendingUp, TrendingDown, Info, BarChart2 } from "lucide-react";
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
    <div className="space-y-4">

      {/* 데이터 기준 안내 */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs ${
        isUsingMockData
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        <span>
          {isUsingMockData
            ? "⚠ DB 데이터가 없어 임시 샘플 데이터를 표시 중입니다."
            : `${draws[draws.length - 1]?.drwNo ?? 0}~${draws[0]?.drwNo ?? 0}회차 기준 · 총 ${draws.length}회차`}
        </span>
        {isFetchingDraws && <span className="text-indigo-500 font-medium animate-pulse">갱신 중...</span>}
      </div>

      {/* 최신 당첨 + 최근 이력 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 최신 회차 헤드라인 */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-indigo-200 px-2 py-0.5 rounded-full bg-white/20 inline-block mb-2 uppercase tracking-wide">LATEST DRAW</span>
            <h3 className="font-extrabold text-xl text-white mb-0.5">제 {draws[0]?.drwNo || "0000"}회</h3>
            <p className="text-xs text-indigo-200">{draws[0]?.drwNoDate || "2000-01-01"}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[draws[0]?.no1, draws[0]?.no2, draws[0]?.no3, draws[0]?.no4, draws[0]?.no5, draws[0]?.no6].map((num, idx) => (
              <span key={idx} className={`w-8 h-8 rounded-full border-2 border-white/80 text-xs font-extrabold flex items-center justify-center shadow-md ${num ? getLottoBallColor(num) : "bg-white/30 text-white"}`}>
                {num}
              </span>
            ))}
            <span className="text-white/60 text-xs px-0.5">+</span>
            <span className={`w-8 h-8 rounded-full border-2 border-white/40 text-xs font-extrabold flex items-center justify-center opacity-80 shadow-md ${draws[0]?.bonusNo ? getLottoBallColor(draws[0].bonusNo) : "bg-white/30 text-white"}`}>
              {draws[0]?.bonusNo}
            </span>
          </div>
          <div className="space-y-1 text-xs text-indigo-200 border-t border-white/20 pt-3">
            <div className="flex justify-between">
              <span>1등 당첨금</span>
              <span className="font-bold text-white">{draws[0]?.firstWinAmnt ? `${(draws[0].firstWinAmnt / 100000000).toFixed(1)}억원` : "집계 전"}</span>
            </div>
            <div className="flex justify-between">
              <span>1등 당첨 인원</span>
              <span className="font-bold text-white">{draws[0]?.firstPrzWnerCo ? `${draws[0].firstPrzWnerCo}명` : "집계 전"}</span>
            </div>
          </div>
        </div>

        {/* 최근 이력 */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">최근 당첨 이력 (최대 10회)</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {draws.slice(0, 10).map((draw) => (
              <div key={draw.drwNo} className="py-2 first:pt-0 flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 w-12 shrink-0">{draw.drwNo}회</span>
                <div className="flex items-center gap-1">
                  {[draw.no1, draw.no2, draw.no3, draw.no4, draw.no5, draw.no6].map((num, idx) => (
                    <span key={idx} className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center ${getLottoBallColor(num)}`}>{num}</span>
                  ))}
                  <span className="text-[9px] text-slate-300 px-0.5">+</span>
                  <span className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center opacity-80 ${getLottoBallColor(draw.bonusNo)}`}>{draw.bonusNo}</span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:inline ml-auto">{draw.drwNoDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 자주 나온 번호 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />많이 출현한 번호 TOP 10
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {statsData.topNumbers.map((item) => (
              <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <span className={`w-7 h-7 rounded-full border text-[10px] font-extrabold flex items-center justify-center ${getLottoBallColor(item.num)}`}>{item.num}</span>
                <span className="text-[9px] text-slate-500 font-bold">{item.count}회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 적게 나온 번호 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />적게 출현한 번호 LAST 10
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {statsData.bottomNumbers.map((item) => (
              <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <span className={`w-7 h-7 rounded-full border text-[10px] font-extrabold flex items-center justify-center ${getLottoBallColor(item.num)}`}>{item.num}</span>
                <span className="text-[9px] text-slate-500 font-bold">{item.count}회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 홀짝 분포 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500" />역대 홀짝 분포
          </h3>
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>홀수</span><span className="text-indigo-600">{statsData.oddPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${statsData.oddPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>짝수</span><span className="text-rose-500">{statsData.evenPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-rose-400 h-full rounded-full transition-all" style={{ width: `${statsData.evenPct}%` }} />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">* {draws.length}회차 전체 공 기준</p>
        </div>
      </div>
    </div>
  );
}
