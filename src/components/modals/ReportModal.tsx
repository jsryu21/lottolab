"use client";

import { X } from "lucide-react";
import { PerformanceReport } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";

interface ReportModalProps {
  reportTargetSet: number[];
  performanceReport: PerformanceReport;
  onClose: () => void;
}

export default function ReportModal({ reportTargetSet, performanceReport, onClose }: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden">

        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />

        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="text-center mb-5">
            <span className="text-[10px] font-bold text-indigo-600 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 inline-block mb-2 uppercase tracking-wide">
              Historical Performance
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-1">과거 당첨 성적표</h3>
            <p className="text-xs text-slate-500">선택 조합이 역대 당첨 데이터와 부합하는지 분석했습니다.</p>
          </div>

          {/* 대상 번호 */}
          <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block mb-2.5 font-medium">검증 대상 조합</span>
            <div className="flex justify-center gap-2">
              {reportTargetSet.map((n) => (
                <span key={n} className={`w-9 h-9 rounded-full border-2 text-xs font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(n)}`}>{n}</span>
              ))}
            </div>
          </div>

          {/* 최고 성적 */}
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">역대 최고 당첨 성적</span>
              <span className={`text-sm font-extrabold px-3 py-1 rounded-full border ${
                performanceReport.highestRank !== "없음"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
                {performanceReport.highestRank}
              </span>
            </div>
            {performanceReport.highestDrawNo && (
              <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-3">
                <span className="text-slate-500">최고 성적 기록 회차</span>
                <span className="font-bold text-slate-800">제 {performanceReport.highestDrawNo}회차 ({performanceReport.highestDate})</span>
              </div>
            )}
          </div>

          {/* 매칭 통계 */}
          <div className="mb-6">
            <span className="text-xs font-bold text-slate-700 block mb-2">역대 회차 매칭 통계</span>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: "1등", value: performanceReport.counts.first, color: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "2등", value: performanceReport.counts.second, color: "text-orange-600 bg-orange-50 border-orange-200" },
                { label: "3등", value: performanceReport.counts.third, color: "text-blue-600 bg-blue-50 border-blue-200" },
                { label: "4등", value: performanceReport.counts.fourth, color: "text-slate-600 bg-slate-50 border-slate-200" },
                { label: "5등", value: performanceReport.counts.fifth, color: "text-slate-500 bg-slate-50 border-slate-200" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-2.5 border ${item.color}`}>
                  <span className="text-[10px] font-medium block mb-0.5">{item.label}</span>
                  <span className="text-sm font-extrabold">{item.value}회</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm">
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
}
