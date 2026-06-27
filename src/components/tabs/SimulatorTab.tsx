"use client";

import { Play, RefreshCw, Info, TrendingDown } from "lucide-react";
import { SavedNumber } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";
import LoginGateCard from "@/components/LoginGateCard";

interface SimResults {
  ran: boolean;
  totalSpent: number;
  totalWon: number;
  roi: number;
  matches: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    none: number;
  };
}

interface SimulatorTabProps {
  user: { id: string; email: string } | null;
  savedNumbers: SavedNumber[];
  selectedSimSet: number[] | null;
  simBudget: number;
  simMode: "historical" | "montecarlo";
  simResults: SimResults | null;
  isSimulating: boolean;
  setSelectedSimSet: (v: number[] | null) => void;
  setSimBudget: (v: number) => void;
  setSimMode: (v: "historical" | "montecarlo") => void;
  setSimResults: (v: SimResults | null) => void;
  onRunSimulation: () => void;
  onLoginGate: () => void;
}

export default function SimulatorTab({
  user,
  savedNumbers,
  selectedSimSet,
  simBudget,
  simMode,
  simResults,
  isSimulating,
  setSelectedSimSet,
  setSimBudget,
  setSimMode,
  setSimResults,
  onRunSimulation,
  onLoginGate,
}: SimulatorTabProps) {
  if (!user) {
    return <LoginGateCard tab="simulator" onLogin={onLoginGate} />;
  }

  return (
    <div className="space-y-4">

      {/* 설정 카드 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Play className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">역대 회차 대입 모의 투자</h2>
            <p className="text-[11px] text-slate-400">로또 당첨 현실성을 시뮬레이션으로 점검합니다</p>
          </div>
        </div>

        {/* 번호 선택 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">시뮬레이션 대입 조합</label>
          {savedNumbers.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500">보관함에 저장된 번호가 없습니다.</p>
              <button onClick={() => setSelectedSimSet([1, 7, 15, 23, 33, 45])}
                className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700">
                [1, 7, 15, 23, 33, 45] 임시 적용
              </button>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {savedNumbers.map((item) => (
                <button key={item.id}
                  onClick={() => { setSelectedSimSet(item.numbers); setSimResults(null); }}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    selectedSimSet?.join(",") === item.numbers.join(",")
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}>
                  <div className="flex gap-1.5">
                    {item.numbers.map((n) => (
                      <span key={n} className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${getLottoBallColor(n)}`}>{n}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">{item.memo || "보관 조합"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSimSet && (
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
            <span className="text-[10px] text-indigo-500 block mb-1.5 font-medium">선택된 타겟 번호</span>
            <div className="flex justify-center gap-1.5">
              {selectedSimSet.map((n) => (
                <span key={n} className={`w-8 h-8 rounded-full border-2 text-[11px] font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(n)}`}>{n}</span>
              ))}
            </div>
          </div>
        )}

        {/* 시뮬레이션 방식 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">시뮬레이션 방식</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "역대 전체 대조", sub: "모든 역대 회차에 대입", value: "historical" },
              { label: "몬테카를로", sub: "예산 게임 수 무작위 추첨", value: "montecarlo" },
            ].map((mode) => (
              <button key={mode.value}
                onClick={() => { setSimMode(mode.value as "historical" | "montecarlo"); setSimResults(null); }}
                className={`py-2.5 px-3 rounded-xl text-left border transition-all ${
                  simMode === mode.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400"
                }`}>
                <div className="text-[11px] font-bold">{mode.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{mode.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 예산 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            모의 구매 예산
            {simMode === "historical" && <span className="ml-2 text-[10px] text-slate-400 font-normal">(역대 대조 모드에서는 미사용)</span>}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[10000, 50000, 100000, 1000000].map((amount) => (
              <button key={amount} onClick={() => { setSimBudget(amount); setSimResults(null); }}
                className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                  simBudget === amount ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                {(amount / 10000).toLocaleString()}만
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-right">1게임 = 1,000원 ({simBudget / 1000}게임)</p>
        </div>

        {/* 실행 버튼 */}
        <button disabled={!selectedSimSet || isSimulating} onClick={onRunSimulation}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm">
          {isSimulating ? (<><RefreshCw className="w-4 h-4 animate-spin" />분석 중...</>) : (<><Play className="w-4 h-4" />모의 투자 시뮬레이션 시작</>)}
        </button>
      </div>

      {/* 결과 카드 */}
      {simResults && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">시뮬레이션 결과</h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">{simMode === "historical" ? "총 대조 횟수" : "총 투자액"}</span>
              <span className="text-sm font-bold text-slate-800">{simMode === "historical" ? `${(simResults.totalSpent / 1000).toLocaleString()}회` : `${(simResults.totalSpent / 10000).toLocaleString()}만원`}</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
              <span className="text-[10px] text-emerald-600 block mb-1">총 당첨금</span>
              <span className="text-sm font-bold text-emerald-700">{simResults.totalWon.toLocaleString()}원</span>
            </div>
            <div className={`rounded-xl p-3 text-center border ${simResults.roi >= 100 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <span className={`text-[10px] block mb-1 ${simResults.roi >= 100 ? "text-emerald-600" : "text-rose-500"}`}>수익률 (ROI)</span>
              <span className={`text-sm font-bold flex items-center justify-center gap-0.5 ${simResults.roi >= 100 ? "text-emerald-700" : "text-rose-600"}`}>
                {simResults.roi.toFixed(2)}%
                {simResults.roi < 100 && <TrendingDown className="w-3.5 h-3.5" />}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600 block">등수별 당첨 횟수</span>
            {[
              { label: "1등 (6개 일치)", count: simResults.matches.first, prize: "~20억", colorClass: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "2등 (5개+보너스)", count: simResults.matches.second, prize: "~6천만", colorClass: "bg-orange-50 border-orange-200 text-orange-700" },
              { label: "3등 (5개 일치)", count: simResults.matches.third, prize: "~150만", colorClass: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "4등 (4개 일치)", count: simResults.matches.fourth, prize: "5만원", colorClass: "bg-slate-50 border-slate-200 text-slate-600" },
              { label: "5등 (3개 일치)", count: simResults.matches.fifth, prize: "5천원", colorClass: "bg-slate-50 border-slate-200 text-slate-500" },
              { label: "낙첨 (2개 이하)", count: simResults.matches.none, prize: "0원", colorClass: "bg-slate-50 border-slate-200 text-slate-400" },
            ].map((row, idx) => (
              <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border ${row.colorClass}`}>
                <span className="text-[11px] font-semibold">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] opacity-60">({row.prize})</span>
                  <span className="text-xs font-extrabold">{row.count}회</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>로또는 재미로 즐기는 건전한 오락입니다. 과도한 구매는 자제해 주세요.</span>
          </div>
        </div>
      )}

      {!simResults && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">결과 대기 중</p>
          <p className="text-[11px] text-slate-400 mt-1">번호와 예산을 선택하고 시뮬레이션을 시작하세요.</p>
        </div>
      )}
    </div>
  );
}
