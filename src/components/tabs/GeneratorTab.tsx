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
  user, gridModes, fixedNumbers, excludedNumbers,
  oddEvenRatio, sumPreset, customMinSum, customMaxSum,
  generateCount, generatedSets, justSavedIndex,
  showAdvancedFilters, consecutiveLimit, endingSumPreset,
  customMinEndingSum, customMaxEndingSum,
  setOddEvenRatio, setSumPreset, setCustomMinSum, setCustomMaxSum,
  setGenerateCount, setShowAdvancedFilters, setConsecutiveLimit,
  setEndingSumPreset, setCustomMinEndingSum, setCustomMaxEndingSum,
  onGridClick, onResetGrid, onGenerate, onCopy, onOpenReport, onSaveNumber, onLoginGate,
}: GeneratorTabProps) {
  return (
    <div className="space-y-4">

      {/* 생성 버튼 + 결과 (항상 상단 배치 - 모바일 UX) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">번호 추천 생성</h2>
            <p className="text-[11px] text-slate-400">아래 필터 조건을 적용해 6/45 번호를 추출합니다</p>
          </div>
        </div>
        <button
          onClick={onGenerate}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Dices className="w-4 h-4" />
          행운의 번호 추천받기
        </button>
      </div>

      {/* 생성 결과 */}
      {generatedSets.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">추천 결과 {generatedSets.length}개</span>
            <span className="text-[10px] text-slate-400">우측 아이콘으로 저장/복사</span>
          </div>
          <div className="divide-y divide-slate-100">
            {generatedSets.map((set, idx) => {
              const { odd, even } = calculateOddEven(set);
              const sum = calculateSum(set);
              const isSaved = justSavedIndex === idx;
              return (
                <React.Fragment key={idx}>
                  <div className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 w-4">#{idx + 1}</span>
                        {set.map((num) => (
                          <span key={num} className={`w-9 h-9 rounded-full border-2 text-xs font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(num)}`}>
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">합계 {sum}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">홀짝 {odd}:{even}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onCopy(set)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (!user) { onLoginGate(); return; } onOpenReport(set); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                        >
                          {!user && <Lock className="w-2.5 h-2.5" />}
                          성적표
                        </button>
                        <button
                          onClick={() => onSaveNumber(set, idx)}
                          disabled={isSaved}
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                            isSaved ? "bg-emerald-50 border border-emerald-200 text-emerald-600" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                          }`}
                        >
                          {isSaved ? <><CheckCircle className="w-3 h-3" />저장됨</> : <><Bookmark className="w-3 h-3" />보관</>}
                        </button>
                      </div>
                    </div>
                  </div>
                  {(idx + 1) % 3 === 0 && (
                    <div className="py-2">
                      <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE ?? ""} adFormat="auto" className="rounded-xl" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 필터 패널 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 relative">

        {/* 비로그인 오버레이 */}
        {!user && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center z-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-center px-6">
              <p className="text-sm font-bold text-slate-800 mb-1">필터는 로그인 후 이용 가능합니다</p>
              <p className="text-[11px] text-slate-500">위 버튼으로 필터 없이 랜덤 추출은 바로 가능합니다.</p>
            </div>
            <button onClick={onLoginGate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all">
              로그인 / 무료 회원가입
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <span className="font-bold text-sm text-slate-900">필터 설정</span>
          </div>
          <button onClick={onResetGrid} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors font-medium">
            <RefreshCw className="w-3 h-3" />초기화
          </button>
        </div>

        {/* 번호 그리드 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700">번호 직접 선택 (고정/제외)</label>
            <span className="text-[10px] text-slate-400">고정수 최대 5개</span>
          </div>
          <div className="flex gap-3 text-[10px] mb-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1 text-indigo-600 font-semibold"><span className="w-2 h-2 rounded-full bg-indigo-500" />고정 (1클릭)</span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold"><span className="w-2 h-2 rounded-full bg-rose-500" />제외 (2클릭)</span>
            <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300" />해제 (3클릭)</span>
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const mode = gridModes[num] || "none";
              let btnStyle = "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400";
              if (mode === "fixed") btnStyle = "bg-indigo-500 border-indigo-400 text-white shadow-sm";
              else if (mode === "excluded") btnStyle = "bg-rose-500 border-rose-400 text-white shadow-sm";
              return (
                <button key={num} onClick={() => onGridClick(num)} className={`w-full aspect-square text-[11px] font-bold rounded-lg border flex items-center justify-center transition-all ${btnStyle}`}>
                  {num}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <div className="flex gap-1.5"><span className="text-slate-500">고정:</span><span className="font-bold text-indigo-600">{fixedNumbers.length > 0 ? fixedNumbers.join(", ") : "없음"}</span></div>
            <div className="flex gap-1.5"><span className="text-slate-500">제외:</span><span className="font-bold text-rose-600">{excludedNumbers.length > 0 ? excludedNumbers.join(", ") : "없음"}</span></div>
          </div>
        </div>

        {/* 홀짝 비율 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">홀짝 비율</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[{ label: "전체", value: "all" }, { label: "홀3:짝3", value: "3:3" }, { label: "홀2:짝4", value: "2:4" }, { label: "홀4:짝2", value: "4:2" }, { label: "홀1:짝5", value: "1:5" }, { label: "홀5:짝1", value: "5:1" }, { label: "홀0:짝6", value: "0:6" }, { label: "홀6:짝0", value: "6:0" }].map((item) => (
              <button key={item.value} onClick={() => setOddEvenRatio(item.value)}
                className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${oddEvenRatio === item.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 합계 범위 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">총합계 범위</label>
          <div className="flex gap-2 mb-2">
            {[{ label: "제한 없음", value: "all" }, { label: "100~150 (권장)", value: "recommended" }, { label: "직접 입력", value: "custom" }].map((item) => (
              <button key={item.value} onClick={() => setSumPreset(item.value as "all" | "recommended" | "custom")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${sumPreset === item.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                {item.label}
              </button>
            ))}
          </div>
          {sumPreset === "custom" && (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input type="number" value={customMinSum} onChange={(e) => setCustomMinSum(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg text-center py-1.5 text-xs focus:outline-none focus:border-indigo-400" placeholder="최소" />
              <span className="text-slate-400 text-xs">~</span>
              <input type="number" value={customMaxSum} onChange={(e) => setCustomMaxSum(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg text-center py-1.5 text-xs focus:outline-none focus:border-indigo-400" placeholder="최대" />
            </div>
          )}
        </div>

        {/* 추출 개수 */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">추출 개수</label>
          <div className="flex gap-2">
            {[1, 5, 10].map((num) => (
              <button key={num} onClick={() => setGenerateCount(num)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${generateCount === num ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                {num}개{num === 5 && " ★"}
              </button>
            ))}
          </div>
        </div>

        {/* 고급 설정 */}
        <div className="border-t border-slate-100 pt-4">
          <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-indigo-500" />고급 분석 설정</span>
            <span className="text-[10px] text-indigo-500">{showAdvancedFilters ? "닫기 ▲" : "열기 ▼"}</span>
          </button>
          {showAdvancedFilters && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-2">연속 번호 제한</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ label: "제한 없음", value: 0 }, { label: "2연속 차단", value: 2 }, { label: "3연속 차단", value: 3 }].map((opt) => (
                    <button key={opt.value} onClick={() => setConsecutiveLimit(opt.value)}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${consecutiveLimit === opt.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-2">끝수 합 필터</label>
                <div className="flex gap-1.5 mb-2">
                  {[{ label: "제한 없음", value: "all" }, { label: "15~35 (추천)", value: "recommended" }, { label: "직접 입력", value: "custom" }].map((item) => (
                    <button key={item.value} onClick={() => setEndingSumPreset(item.value as "all" | "recommended" | "custom")}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all ${endingSumPreset === item.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
                {endingSumPreset === "custom" && (
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input type="number" value={customMinEndingSum} onChange={(e) => setCustomMinEndingSum(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg text-center py-1 text-xs focus:outline-none focus:border-indigo-400" placeholder="최소" />
                    <span className="text-slate-400 text-xs">~</span>
                    <input type="number" value={customMaxEndingSum} onChange={(e) => setCustomMaxEndingSum(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg text-center py-1 text-xs focus:outline-none focus:border-indigo-400" placeholder="최대" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
