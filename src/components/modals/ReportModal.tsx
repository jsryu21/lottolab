"use client";

import { PerformanceReport } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";

interface ReportModalProps {
  reportTargetSet: number[];
  performanceReport: PerformanceReport;
  onClose: () => void;
}

export default function ReportModal({ reportTargetSet, performanceReport, onClose }: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
        >
          &times;
        </button>

        {/* 타이틀 */}
        <div className="text-center mb-5">
          <span className="text-[10px] font-extrabold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-900/60 inline-block mb-2 uppercase tracking-wide">
            HISTORICAL PERFORMANCE
          </span>
          <h3 className="text-lg font-bold text-white mb-1">과거 당첨 성적표</h3>
          <p className="text-xs text-slate-400">
            선택하신 조합이 역대 실제 당첨 데이터와 부합하는지 분석했습니다.
          </p>
        </div>

        {/* 대상 번호 표시 */}
        <div className="mb-5 p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 block mb-2">검증 대상 조합</span>
          <div className="flex justify-center gap-1.5">
            {reportTargetSet.map((n) => (
              <span
                key={n}
                className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-md ${getLottoBallColor(n)}`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* 결과 요약 카드 */}
        <div className="mb-5 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">역대 최고 당첨 성적</span>
            <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded border ${
              performanceReport.highestRank !== "없음"
                ? "bg-emerald-950/60 border-emerald-900 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              {performanceReport.highestRank}
            </span>
          </div>

          {performanceReport.highestDrawNo && (
            <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2.5">
              <span className="text-slate-400">최고 성적 기록 회차</span>
              <span className="font-bold text-slate-200">
                제 {performanceReport.highestDrawNo}회차 ({performanceReport.highestDate})
              </span>
            </div>
          )}
        </div>

        {/* 누적 매칭 통계 */}
        <div className="space-y-2 mb-6">
          <span className="text-xs font-bold text-slate-400 block mb-1">역대 회차 매칭 통계</span>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 block mb-0.5">1등</span>
              <span className="font-bold text-amber-400">{performanceReport.counts.first}회</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 block mb-0.5">2등</span>
              <span className="font-bold text-blue-400">{performanceReport.counts.second}회</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 block mb-0.5">3등</span>
              <span className="font-bold text-slate-200">{performanceReport.counts.third}회</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 block mb-0.5">4등</span>
              <span className="font-bold text-slate-300">{performanceReport.counts.fourth}회</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 block mb-0.5">5등</span>
              <span className="font-bold text-slate-400">{performanceReport.counts.fifth}회</span>
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all"
        >
          확인 완료
        </button>
      </div>
    </div>
  );
}
