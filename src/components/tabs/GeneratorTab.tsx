"use client";

import React from "react";
import { Dices, Lock, RefreshCw, Sliders, Sparkles, Copy, Bookmark, CheckCircle } from "lucide-react";
import { calculateOddEven, calculateSum } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";
import AdBanner from "@/components/AdBanner";

interface GeneratorTabProps {
  user: { id: string; email: string } | null;
  gridModes: Record<number, "fixed" | "excluded" | "none">;
  fixedNumbers: number[];
  excludedNumbers: number[];
  oddEvenRatio: string;
  sumPreset: "all" | "recommended" | "custom";
  customMinSum: number;
  customMaxSum: number;
  generateCount: number;
  generatedSets: number[][];
  justSavedIndex: number | null;
  showAdvancedFilters: boolean;
  consecutiveLimit: number;
  endingSumPreset: "all" | "recommended" | "custom";
  customMinEndingSum: number;
  customMaxEndingSum: number;
  setOddEvenRatio: (v: string) => void;
  setSumPreset: (v: "all" | "recommended" | "custom") => void;
  setCustomMinSum: (v: number) => void;
  setCustomMaxSum: (v: number) => void;
  setGenerateCount: (v: number) => void;
  setShowAdvancedFilters: (v: boolean) => void;
  setConsecutiveLimit: (v: number) => void;
  setEndingSumPreset: (v: "all" | "recommended" | "custom") => void;
  setCustomMinEndingSum: (v: number) => void;
  setCustomMaxEndingSum: (v: number) => void;
  onGridClick: (num: number) => void;
  onResetGrid: () => void;
  onGenerate: () => void;
  onCopy: (nums: number[]) => void;
  onOpenReport: (set: number[]) => void;
  onSaveNumber: (numbers: number[], index: number) => void;
  onLoginGate: () => void;
}

export default function GeneratorTab({
  user,
  gridModes,
  fixedNumbers,
  excludedNumbers,
  oddEvenRatio,
  sumPreset,
  customMinSum,
  customMaxSum,
  generateCount,
  generatedSets,
  justSavedIndex,
  showAdvancedFilters,
  consecutiveLimit,
  endingSumPreset,
  customMinEndingSum,
  customMaxEndingSum,
  setOddEvenRatio,
  setSumPreset,
  setCustomMinSum,
  setCustomMaxSum,
  setGenerateCount,
  setShowAdvancedFilters,
  setConsecutiveLimit,
  setEndingSumPreset,
  setCustomMinEndingSum,
  setCustomMaxEndingSum,
  onGridClick,
  onResetGrid,
  onGenerate,
  onCopy,
  onOpenReport,
  onSaveNumber,
  onLoginGate,
}: GeneratorTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {/* Left Column: Filter Panel */}
      <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6 relative">

        {/* 비로그인 잠금 오버레이 */}
        {!user && (
          <div className="absolute inset-0 bg-slate-950/75 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-[2px] gap-3">
            <Lock className="w-7 h-7 text-slate-400" />
            <div className="text-center px-4">
              <p className="text-sm font-bold text-slate-200 mb-1">필터 기능은 로그인 후 이용 가능합니다</p>
              <p className="text-[11px] text-slate-400">아래 버튼으로 필터 없이 랜덤 추출은 바로 가능합니다.</p>
            </div>
            <button
              onClick={onLoginGate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              로그인 / 무료 회원가입
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base">필터 설정</h2>
          </div>
          <button
            onClick={onResetGrid}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            필터 초기화
          </button>
        </div>

        {/* 1. 번호 선택 그리드 */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
            <span>번호 직접 선택 (고정/제외 지정)</span>
            <span className="text-[10px] text-slate-500 font-normal">고정수는 최대 5개까지 선택 가능</span>
          </label>

          <div className="mb-3 grid grid-cols-3 text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> 고정수 (1회 클릭)
            </div>
            <div className="flex items-center justify-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> 제외수 (2회 클릭)
            </div>
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" /> 해제 (3회 클릭)
            </div>
          </div>

          <div className="grid grid-cols-9 gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const mode = gridModes[num] || "none";
              let btnStyle = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700";
              if (mode === "fixed") {
                btnStyle = "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20";
              } else if (mode === "excluded") {
                btnStyle = "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-500/20";
              }
              return (
                <button
                  key={num}
                  onClick={() => onGridClick(num)}
                  className={`w-full aspect-square text-[11px] font-bold rounded-md border flex items-center justify-center transition-all ${btnStyle}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="mt-3.5 space-y-1.5 text-xs">
            <div className="flex gap-2">
              <span className="text-slate-400 shrink-0">고정수:</span>
              <span className="font-bold text-blue-400">
                {fixedNumbers.length > 0 ? fixedNumbers.join(", ") : "없음"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 shrink-0">제외수:</span>
              <span className="font-bold text-rose-400">
                {excludedNumbers.length > 0 ? excludedNumbers.join(", ") : "없음"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. 홀짝 비율 필터 */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">홀짝 비율 지정</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "전체", value: "all" },
              { label: "홀3 : 짝3", value: "3:3" },
              { label: "홀2 : 짝4", value: "2:4" },
              { label: "홀4 : 짝2", value: "4:2" },
              { label: "홀1 : 짝5", value: "1:5" },
              { label: "홀5 : 짝1", value: "5:1" },
              { label: "홀0 : 짝6", value: "0:6" },
              { label: "홀6 : 짝0", value: "6:0" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setOddEvenRatio(item.value)}
                className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                  oddEvenRatio === item.value
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 합계 범위 필터 */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">총합계 범위 필터</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSumPreset("all")}
              className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                sumPreset === "all"
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              제한 없음
            </button>
            <button
              onClick={() => setSumPreset("recommended")}
              className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                sumPreset === "recommended"
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              100 ~ 150 (권장)
            </button>
            <button
              onClick={() => setSumPreset("custom")}
              className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                sumPreset === "custom"
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              직접 입력
            </button>
          </div>

          {sumPreset === "custom" && (
            <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded border border-slate-800">
              <input
                type="number"
                value={customMinSum}
                onChange={(e) => setCustomMinSum(Number(e.target.value))}
                className="w-full bg-slate-900 text-center rounded border border-slate-800 py-1 text-xs text-white"
                placeholder="최소"
              />
              <span className="text-slate-500 text-xs">~</span>
              <input
                type="number"
                value={customMaxSum}
                onChange={(e) => setCustomMaxSum(Number(e.target.value))}
                className="w-full bg-slate-900 text-center rounded border border-slate-800 py-1 text-xs text-white"
                placeholder="최대"
              />
            </div>
          )}
        </div>

        {/* 4. 추출 개수 선택 */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">추천 조합 개수</label>
          <div className="flex gap-2">
            {[1, 5, 10].map((num) => (
              <button
                key={num}
                onClick={() => setGenerateCount(num)}
                className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                  generateCount === num
                    ? "bg-blue-600/20 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                {num}개 {num === 5 && "(추천)"}
              </button>
            ))}
          </div>
        </div>

        {/* 5. 고급 설정 토글 */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              고급 분석 설정
            </span>
            <span className="text-[10px] text-blue-400">
              {showAdvancedFilters ? "닫기 ▲" : "열기 ▼"}
            </span>
          </button>

          {showAdvancedFilters && (
            <div className="mt-4 space-y-4 pt-2">
              {/* 연속 번호 제한 */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex justify-between">
                  <span>연속 번호 제한 (연속 수 차단)</span>
                  <span className="text-[9px] text-slate-500 font-normal">정밀 조합 필터</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "제한 없음", value: 0 },
                    { label: "2연속 차단", value: 2 },
                    { label: "3연속 차단", value: 3 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConsecutiveLimit(opt.value)}
                      className={`py-1 rounded text-[10px] font-bold border transition-all ${
                        consecutiveLimit === opt.value
                          ? "bg-blue-600/20 border-blue-500 text-blue-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 끝수 합 필터 */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  끝수 합 필터 (일의 자리 합계 제어)
                </label>
                <div className="flex gap-1.5 mb-2">
                  <button
                    onClick={() => setEndingSumPreset("all")}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                      endingSumPreset === "all"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    제한 없음
                  </button>
                  <button
                    onClick={() => setEndingSumPreset("recommended")}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                      endingSumPreset === "recommended"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    15 ~ 35 (추천)
                  </button>
                  <button
                    onClick={() => setEndingSumPreset("custom")}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                      endingSumPreset === "custom"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    직접 입력
                  </button>
                </div>

                {endingSumPreset === "custom" && (
                  <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                    <input
                      type="number"
                      value={customMinEndingSum}
                      onChange={(e) => setCustomMinEndingSum(Number(e.target.value))}
                      className="w-full bg-slate-900 text-center rounded border border-slate-800 py-0.5 text-xs text-white"
                      placeholder="최소"
                    />
                    <span className="text-slate-500 text-xs">~</span>
                    <input
                      type="number"
                      value={customMaxEndingSum}
                      onChange={(e) => setCustomMaxEndingSum(Number(e.target.value))}
                      className="w-full bg-slate-900 text-center rounded border border-slate-800 py-0.5 text-xs text-white"
                      placeholder="최대"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Display Panel */}
      <div className="lg:col-span-7 space-y-6">

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-blue-950/60 border border-blue-900/50 rounded-full mb-3 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-bold text-base mb-1">행운의 번호 준비 완료</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5">
            지정하신 조건 필터를 충족하는 6/45 최적화 조합을 생성합니다.
          </p>
          <button
            onClick={onGenerate}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] w-full sm:w-auto"
          >
            <Dices className="w-4 h-4" />
            로또 번호 추천받기
          </button>
        </div>

        {/* 생성된 세트 결과 */}
        {generatedSets.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-400">추천 생성 결과</span>
              <span className="text-[10px] text-slate-500">각 행 우측의 아이콘으로 저장/복사 가능</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {generatedSets.map((set, idx) => {
                const { odd, even } = calculateOddEven(set);
                const sum = calculateSum(set);
                const isSaved = justSavedIndex === idx;

                return (
                  <React.Fragment key={idx}>
                    <div className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      {/* 번호 볼 리스트 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 w-5">#{idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          {set.map((num) => (
                            <span
                              key={num}
                              className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-inner ${getLottoBallColor(num)}`}
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 상세 스펙 및 액션 */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                            합계: {sum}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                            홀짝: {odd}:{even}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onCopy(set)}
                            title="복사"
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (!user) { onLoginGate(); return; }
                              onOpenReport(set);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded border bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
                          >
                            {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                            성적표
                          </button>
                          <button
                            onClick={() => onSaveNumber(set, idx)}
                            disabled={isSaved}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded border transition-all ${
                              isSaved
                                ? "bg-emerald-950 border-emerald-900 text-emerald-400"
                                : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                저장됨
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3 h-3" />
                                보관
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 광고 지면: 3세트마다 노출 */}
                    {(idx + 1) % 3 === 0 && (
                      <div className="my-3">
                        <AdBanner
                          adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE ?? ""}
                          adFormat="auto"
                          className="rounded-lg"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
