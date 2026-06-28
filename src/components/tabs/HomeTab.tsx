"use client";

import { useState } from "react";
import { Search, Flame, Sparkles, ChevronRight, HelpCircle, Trophy } from "lucide-react";
import { LottoDraw } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function getTodayNumbers(): number[] {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rand = seededRandom(seed);
  const nums = new Set<number>();
  while (nums.size < 6) nums.add(Math.floor(rand() * 45) + 1);
  return [...nums].sort((a, b) => a - b);
}

function getHeatColor(intensity: number) {
  if (intensity < 0.2) return "bg-slate-100 text-slate-500 border-slate-200";
  if (intensity < 0.4) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (intensity < 0.6) return "bg-amber-200 text-amber-900 border-amber-300";
  if (intensity < 0.8) return "bg-orange-300 text-orange-900 border-orange-400";
  return "bg-red-400 text-white border-red-500";
}

const FAQ_ITEMS = [
  { q: "로또 1등 당첨 확률은?", a: "로또 6/45 기준 1등 당첨 확률은 약 814만 분의 1입니다. 6개 번호를 모두 맞혀야 하며, 1게임당 구매 금액은 1,000원입니다." },
  { q: "로또는 어디서 구매하나요?", a: "전국 로또 판매점(편의점·복권방) 또는 동행복권 공식 앱(인터넷 복권)을 통해 구매할 수 있습니다. 매주 토요일 오후 8시 45분에 추첨합니다." },
  { q: "번호 생성기는 어떻게 작동하나요?", a: "고정/제외 번호 설정, 홀짝 비율, 번호 합계 범위 등 다양한 필터를 적용하여 조건에 맞는 번호를 무작위로 생성합니다. 통계적 당첨을 보장하지는 않습니다." },
  { q: "AI 꿈 해몽 기능은 무엇인가요?", a: "Google Gemini AI가 꿈 내용을 분석하여 상징적 의미에서 추출한 6개의 행운 번호를 제안합니다. 로그인 후 이용 가능합니다." },
  { q: "모의 투자 시뮬레이터란?", a: "저장한 번호를 역대 로또 당첨번호와 대조하거나, 몬테카를로 방식으로 무작위 시뮬레이션하여 이론적 수익률을 계산합니다." },
  { q: "오늘의 행운 번호는 어떻게 생성되나요?", a: "오늘 날짜를 시드(seed)로 사용해 매일 동일한 6개 번호를 보여주는 참고용 번호입니다. 실제 당첨 확률과는 무관합니다." },
];

interface HomeTabProps {
  draws: LottoDraw[];
}

export default function HomeTab({ draws }: HomeTabProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<LottoDraw | null | "notfound">(null);

  const todayNumbers = getTodayNumbers();
  const latest = draws[0];

  // 번호별 출현 빈도
  const freq = new Array(46).fill(0);
  draws.forEach((d) => {
    [d.no1, d.no2, d.no3, d.no4, d.no5, d.no6].forEach((n) => freq[n]++);
  });
  const validFreqs = freq.slice(1).filter((f) => f > 0);
  const maxFreq = validFreqs.length ? Math.max(...validFreqs) : 1;
  const minFreq = validFreqs.length ? Math.min(...validFreqs) : 0;

  const handleSearch = () => {
    const num = Number(searchInput);
    if (!num) return;
    const found = draws.find((d) => d.drwNo === num);
    setSearchResult(found ?? "notfound");
  };

  return (
    <div className="space-y-5">

      {/* 오늘의 행운 번호 */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span className="text-sm font-bold text-white">오늘의 행운 번호</span>
          </div>
          <span className="text-[10px] text-indigo-200 bg-white/20 px-2 py-0.5 rounded-full">
            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
          </span>
        </div>
        <div className="flex justify-center gap-2.5">
          {todayNumbers.map((n) => (
            <span key={n} className={`w-11 h-11 rounded-full border-2 border-white/60 text-sm font-extrabold flex items-center justify-center shadow-md ${getLottoBallColor(n)}`}>
              {n}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-indigo-200 text-center mt-3">* 날짜 기반 참고용 번호 · 매일 자정 갱신</p>
      </div>

      {/* 최신 당첨 번호 */}
      {latest && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">최신 당첨 번호</h2>
            <span className="ml-auto text-[11px] text-slate-400">{latest.drwNoDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 shrink-0">제 {latest.drwNo}회</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[latest.no1, latest.no2, latest.no3, latest.no4, latest.no5, latest.no6].map((n, i) => (
                <span key={i} className={`w-8 h-8 rounded-full border-2 text-xs font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(n)}`}>{n}</span>
              ))}
              <span className="text-slate-300 text-xs">+</span>
              <span className={`w-8 h-8 rounded-full border-2 text-xs font-extrabold flex items-center justify-center opacity-75 shadow-sm ${getLottoBallColor(latest.bonusNo)}`}>{latest.bonusNo}</span>
            </div>
          </div>
          {(latest.firstWinAmnt || latest.firstPrzWnerCo) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-6 text-xs text-slate-500">
              {latest.firstWinAmnt && (
                <span>1등 당첨금 <strong className="text-slate-800">{(latest.firstWinAmnt / 100000000).toFixed(1)}억원</strong></span>
              )}
              {latest.firstPrzWnerCo && (
                <span>1등 인원 <strong className="text-slate-800">{latest.firstPrzWnerCo}명</strong></span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 번호 히트맵 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-slate-900">번호별 출현 히트맵</h2>
          <span className="ml-auto text-[10px] text-slate-400">역대 {draws.length}회차 기준</span>
        </div>
        <div className="grid grid-cols-9 gap-1.5">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
            const count = freq[num];
            const intensity = maxFreq > minFreq ? (count - minFreq) / (maxFreq - minFreq) : 0;
            return (
              <div key={num} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${getHeatColor(intensity)}`}
                  title={`${num}번: ${count}회 출현`}
                >
                  {num}
                </div>
                <span className="text-[8px] text-slate-400 font-medium">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400">
          <span>낮음</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-slate-100 via-amber-200 via-orange-300 to-red-400 border border-slate-200" />
          <span>높음</span>
        </div>
      </div>

      {/* 회차별 번호 조회기 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900">회차별 당첨번호 조회</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={latest?.drwNo ?? 9999}
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={`회차 입력 (1 ~ ${latest?.drwNo ?? ""}회)`}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-slate-50 placeholder-slate-400"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            조회
          </button>
        </div>

        {searchResult === "notfound" && (
          <p className="mt-3 text-xs text-rose-500 text-center py-2">해당 회차 데이터가 없습니다.</p>
        )}
        {searchResult && searchResult !== "notfound" && (
          <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-700">제 {searchResult.drwNo}회</span>
              <span className="text-[11px] text-indigo-400">{searchResult.drwNoDate}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[searchResult.no1, searchResult.no2, searchResult.no3, searchResult.no4, searchResult.no5, searchResult.no6].map((n, i) => (
                <span key={i} className={`w-9 h-9 rounded-full border-2 text-xs font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(n)}`}>{n}</span>
              ))}
              <span className="text-slate-300 text-xs px-0.5">+</span>
              <span className={`w-9 h-9 rounded-full border-2 text-xs font-extrabold flex items-center justify-center opacity-75 shadow-sm ${getLottoBallColor(searchResult.bonusNo)}`}>{searchResult.bonusNo}</span>
            </div>
            {(searchResult.firstWinAmnt || searchResult.firstPrzWnerCo) && (
              <div className="mt-3 pt-2.5 border-t border-indigo-200 flex gap-5 text-[11px] text-indigo-600">
                {searchResult.firstWinAmnt && (
                  <span>1등 당첨금 <strong>{(searchResult.firstWinAmnt / 100000000).toFixed(1)}억원</strong></span>
                )}
                {searchResult.firstPrzWnerCo && (
                  <span>1등 인원 <strong>{searchResult.firstPrzWnerCo}명</strong></span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900">자주 묻는 질문</h2>
        </div>
        <div className="space-y-2">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <details key={i} className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer font-semibold text-xs text-slate-700 hover:bg-slate-50 list-none select-none">
                {q}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 group-open:rotate-90 transition-transform duration-200" />
              </summary>
              <p className="px-4 pb-3.5 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-100">{a}</p>
            </details>
          ))}
        </div>
      </div>

    </div>
  );
}
