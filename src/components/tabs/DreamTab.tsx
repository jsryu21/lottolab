"use client";

import { Brain, RefreshCw, Sparkles, CheckCircle, Bookmark, Copy } from "lucide-react";
import { getLottoBallColor } from "@/lib/getLottoBallColor";
import LoginGateCard from "@/components/LoginGateCard";

interface DreamResult {
  interpretation: string;
  keywords: string[];
  numbers: number[];
  isRealAi: boolean;
}

interface DreamLogEntry {
  id: string;
  dream_text: string;
  interpretation: string;
  keywords: string[];
  numbers: number[];
  created_at: string;
}

interface DreamTabProps {
  user: { id: string; email: string } | null;
  dreamInput: string;
  setDreamInput: (v: string) => void;
  dreamLoading: boolean;
  dreamResult: DreamResult | null;
  dreamSaveSuccess: boolean;
  dreamHistory: DreamLogEntry[];
  dreamHistoryLoading: boolean;
  isSupabaseConfigured: boolean;
  onLoginGate: () => void;
  onInterpret: () => void;
  onCopy: (numbers: number[]) => void;
  onSaveDreamNumbers: () => void;
  onSaveHistoryNumbers: (numbers: number[]) => void;
}

export default function DreamTab({
  user,
  dreamInput,
  setDreamInput,
  dreamLoading,
  dreamResult,
  dreamSaveSuccess,
  dreamHistory,
  dreamHistoryLoading,
  isSupabaseConfigured,
  onLoginGate,
  onInterpret,
  onCopy,
  onSaveDreamNumbers,
  onSaveHistoryNumbers,
}: DreamTabProps) {
  if (!user) {
    return <LoginGateCard tab="dream" onLogin={onLoginGate} />;
  }

  return (
    <div className="space-y-4">

      {/* 입력 카드 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">Gemini AI 꿈 해몽</h2>
            <p className="text-[11px] text-slate-400">꿈의 상징을 분석해 행운의 번호를 추출합니다</p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={dreamInput}
            onChange={(e) => setDreamInput(e.target.value)}
            rows={5}
            maxLength={300}
            placeholder="어젯밤에 꾼 꿈을 구체적으로 적어주세요. (예: 깊고 맑은 물속에서 거대한 거북이가 황금 동전을 입에 물고 헤엄쳐와 내 품에 안기는 꿈)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{dreamInput.length} / 300자</span>
            <button
              disabled={!dreamInput.trim() || dreamLoading}
              onClick={onInterpret}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
            >
              {dreamLoading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" />분석 중...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />AI 해몽 분석</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 카드 */}
      {dreamLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-3" />
          <h4 className="font-bold text-sm text-slate-700 mb-1">꿈 분석 중</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Gemini AI가 꿈의 상징을 분석하고 행운의 번호를 추출하고 있습니다.</p>
        </div>
      ) : dreamResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
              {dreamResult.isRealAi ? "Gemini AI 분석" : "로컬 매칭 분석"}
            </span>
            <div className="flex gap-1.5">
              {dreamResult.keywords.map((kw, i) => (
                <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">#{kw}</span>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-indigo-700 mb-1.5 text-[11px]">AI 해몽 진단</p>
            {dreamResult.interpretation}
          </div>

          <div className="text-center py-5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block mb-2.5 font-medium">꿈의 상징과 매칭된 행운의 6개 번호</span>
            <div className="flex justify-center gap-2">
              {dreamResult.numbers.map((n) => (
                <span key={n} className={`w-10 h-10 rounded-full border-2 text-sm font-extrabold flex items-center justify-center shadow-md ${getLottoBallColor(n)}`}>{n}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onCopy(dreamResult.numbers)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
              <Copy className="w-3.5 h-3.5" />복사
            </button>
            <button onClick={onSaveDreamNumbers} disabled={dreamSaveSuccess}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                dreamSaveSuccess ? "bg-emerald-50 border border-emerald-200 text-emerald-600" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}>
              {dreamSaveSuccess ? (<><CheckCircle className="w-3.5 h-3.5" />저장 완료</>) : (<><Bookmark className="w-3.5 h-3.5" />보관함 저장</>)}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <Brain className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">분석 대기 중</p>
          <p className="text-[11px] text-slate-400 mt-1">위 칸에 꿈 내용을 입력하고 분석 버튼을 눌러보세요.</p>
        </div>
      )}

      {/* 해몽 히스토리 */}
      {isSupabaseConfigured && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">내 해몽 히스토리</h3>
            {dreamHistoryLoading && <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />}
          </div>
          {dreamHistory.length === 0 && !dreamHistoryLoading ? (
            <p className="text-xs text-slate-400 py-6 text-center">저장된 해몽 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dreamHistory.map((log) => (
                <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-slate-600 line-clamp-2 flex-1">{log.dream_text}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(log.keywords ?? []).map((kw, i) => (
                      <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100">#{kw}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {(log.numbers ?? []).map((n) => (
                        <span key={n} className={`w-6 h-6 rounded-full text-[10px] font-extrabold flex items-center justify-center ${getLottoBallColor(n)}`}>{n}</span>
                      ))}
                    </div>
                    <button onClick={() => onSaveHistoryNumbers(log.numbers ?? [])}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shrink-0">
                      <Bookmark className="w-2.5 h-2.5" />보관
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
