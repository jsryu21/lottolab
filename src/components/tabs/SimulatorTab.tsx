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
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6">

      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-base">역대 회차 대입 모의 투자</h2>
        </div>
        <span className="text-xs text-slate-400">로또 당첨 현실성을 시뮬레이션으로 점검합니다.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 왼쪽 조작 패널 */}
        <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-5">

          {/* 1. 번호 선택 */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">시뮬레이션 대입 조합 선택</label>

            {savedNumbers.length === 0 ? (
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center text-xs text-slate-400">
                보관함에 저장된 번호가 없습니다. 아래 무작위 조합을 활용하거나 번호를 먼저 보관해 보세요.
                <button
                  onClick={() => setSelectedSimSet([1, 7, 15, 23, 33, 45])}
                  className="block mx-auto mt-2 text-[10px] text-blue-400 font-bold hover:underline"
                >
                  [1, 7, 15, 23, 33, 45] 임시 적용
                </button>
              </div>
            ) : (
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                {savedNumbers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedSimSet(item.numbers);
                      setSimResults(null);
                    }}
                    className={`w-full p-2 rounded border text-left flex items-center justify-between transition-all ${
                      selectedSimSet?.join(",") === item.numbers.join(",")
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-1">
                      {item.numbers.map((n) => (
                        <span key={n} className="text-[10px] font-bold px-1 bg-slate-950 rounded text-slate-300">
                          {n}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">{item.memo || "보관 조합"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택 확인 */}
          {selectedSimSet && (
            <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">선택된 타겟 번호</span>
              <div className="flex justify-center gap-1.5">
                {selectedSimSet.map((n) => (
                  <span key={n} className={`w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center ${getLottoBallColor(n)}`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 2. 시뮬레이션 모드 선택 */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">시뮬레이션 방식</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setSimMode("historical"); setSimResults(null); }}
                className={`py-2 px-3 rounded text-[11px] font-bold border transition-all text-left space-y-0.5 ${
                  simMode === "historical"
                    ? "bg-blue-600/15 border-blue-500 text-blue-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>역대 전체 대조</div>
                <div className="text-[9px] font-normal text-slate-500">모든 역대 회차에 대입</div>
              </button>
              <button
                onClick={() => { setSimMode("montecarlo"); setSimResults(null); }}
                className={`py-2 px-3 rounded text-[11px] font-bold border transition-all text-left space-y-0.5 ${
                  simMode === "montecarlo"
                    ? "bg-blue-600/15 border-blue-500 text-blue-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>몬테카를로</div>
                <div className="text-[9px] font-normal text-slate-500">예산 게임 수 무작위 추첨</div>
              </button>
            </div>
          </div>

          {/* 3. 모의 예산 설정 */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              모의 구매 예산
              {simMode === "historical" && (
                <span className="ml-2 text-[9px] font-normal text-slate-600">(역대 대조 모드에서는 미사용)</span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10000, 50000, 100000, 1000000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSimBudget(amount);
                    setSimResults(null);
                  }}
                  className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                    simBudget === amount
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {amount.toLocaleString()}원
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 text-right">
              * 1게임 = 1,000원 적용 (총 {simBudget / 1000}게임)
            </div>
          </div>

          {/* 실행 버튼 */}
          <button
            disabled={!selectedSimSet || isSimulating}
            onClick={onRunSimulation}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                대입 분석 시뮬레이션 중...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                모의 구매 시뮬레이션 시작
              </>
            )}
          </button>

        </div>

        {/* 오른쪽 결과 패널 */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between gap-4min-h-[350px]">

          {!simResults ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 space-y-2 text-slate-500">
              <Info className="w-10 h-10 text-slate-600 mb-1" />
              <h3 className="font-bold text-sm">결과 대기 중</h3>
              <p className="text-xs max-w-xs">
                좌측에서 시뮬레이션할 번호와 예산을 설정하고 구매 버튼을 클릭하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* 상단 재무 요약 */}
              <div className="grid grid-cols-3 gap-3">

                <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">
                    {simMode === "historical" ? "총 대조 횟수" : "총 투자액"}
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {simMode === "historical"
                      ? `${(simResults.totalSpent / 1000).toLocaleString()}회`
                      : `${simResults.totalSpent.toLocaleString()}원`}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">총 당첨금</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {simResults.totalWon.toLocaleString()}원
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">수익률 (ROI)</span>
                  <span className={`text-sm font-bold flex items-center justify-center gap-0.5 ${simResults.roi >= 100 ? "text-emerald-400" : "text-rose-500"}`}>
                    {simResults.roi.toFixed(2)}%
                    {simResults.roi < 100 && <TrendingDown className="w-3.5 h-3.5" />}
                  </span>
                </div>

              </div>

              {/* 등수 매칭 결과 테이블 */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2.5">등수별 당첨 횟수</span>
                <div className="space-y-2 text-xs">
                  {[
                    { place: "1등 (6개 일치)", count: simResults.matches.first, prize: "가상 20억원", color: "text-amber-400" },
                    { place: "2등 (5개 + 보너스)", count: simResults.matches.second, prize: "가상 6천만원", color: "text-blue-400" },
                    { place: "3등 (5개 일치)", count: simResults.matches.third, prize: "가상 150만원", color: "text-slate-300" },
                    { place: "4등 (4개 일치)", count: simResults.matches.fourth, prize: "50,000원", color: "text-slate-400" },
                    { place: "5등 (3개 일치)", count: simResults.matches.fifth, prize: "5,000원", color: "text-slate-500" },
                    { place: "낙첨 (2개 이하)", count: simResults.matches.none, prize: "0원", color: "text-slate-600" },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-900">
                      <span className={`font-bold ${row.color}`}>{row.place}</span>
                      <div className="flex gap-4">
                        <span className="text-slate-400">({row.prize})</span>
                        <span className="font-extrabold text-slate-200">{row.count}회</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 최종 코멘트 */}
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  {simMode === "historical"
                    ? `역대 ${(simResults.totalSpent / 1000).toLocaleString()}회차 전체에 선택 번호를 대입한 통계 결과입니다. scaleFactor 왜곡 없이 실제 당첨 이력을 그대로 반영합니다.`
                    : "몬테카를로 방식으로 예산 게임 수만큼 독립 무작위 추첨을 시행한 확률론적 결과입니다. 매 실행마다 결과가 달라집니다."}
                  {" "}(로또는 재미로 구매하는 건전한 오락입니다.)
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
