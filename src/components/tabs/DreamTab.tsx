"use client";

import { Brain, RefreshCw, Sparkles, CheckCircle, Bookmark } from "lucide-react";
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
}: DreamTabProps) {
  if (!user) {
    return <LoginGateCard tab="dream" onLogin={onLoginGate} />;
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-base">Gemini AI 꿈 해몽 번호 추출</h2>
        </div>
        <span className="text-xs text-slate-400">꿈속 상징을 분석해 로또 추천 번호로 치환합니다.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 입력 폼 */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">꿈 내용 서술하기</label>
            <textarea
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              rows={6}
              maxLength={300}
              placeholder="어젯밤에 꾼 꿈을 가급적 구체적으로 적어주세요. (예: 깊고 맑은 물속에서 거대한 거북이가 황금 동전을 입에 물고 헤엄쳐와 내 품에 안기는 꿈)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/80 resize-none"
            />
            <div className="text-[10px] text-slate-500 text-right mt-1">{dreamInput.length} / 300자</div>
          </div>

          <button
            disabled={!dreamInput.trim() || dreamLoading}
            onClick={onInterpret}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)]"
          >
            {dreamLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin text-white" /> Gemini AI 꿈 심볼 분석 중...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> AI 해몽 분석 및 번호 추출</>
            )}
          </button>
        </div>

        {/* 결과 패널 */}
        <div className="lg:col-span-6 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[300px]">
          {dreamLoading ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <div>
                <h4 className="font-bold text-xs text-slate-200">꿈 분석 분석관 구동 중</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  거대 언어 모델(Gemini)이 꿈의 상징을 분석해 행운의 키워드를 파싱하고 로또 번호 가중치를 결합 중입니다.
                </p>
              </div>
            </div>
          ) : !dreamResult ? (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 text-slate-500">
              <Brain className="w-10 h-10 text-slate-700 mb-2" />
              <h3 className="font-bold text-xs text-slate-400">분석 대기 중</h3>
              <p className="text-[10px] max-w-xs mt-1">왼쪽 칸에 해몽할 꿈 내용을 입력하고 분석을 클릭하세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-[10px] font-bold text-slate-500">
                  {dreamResult.isRealAi ? "Gemini 1.5 Flash 실시간 AI 분석" : "로컬 매칭 분석 결과"}
                </span>
                <div className="flex gap-1.5">
                  {dreamResult.keywords.map((kw, i) => (
                    <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/60">#{kw}</span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded border border-slate-900 text-xs text-slate-300 leading-5">
                <p className="font-bold text-blue-400 mb-1">AI 해몽 진단</p>
                {dreamResult.interpretation}
              </div>

              <div className="text-center py-4 bg-slate-900/40 rounded border border-slate-900">
                <span className="text-[10px] text-slate-500 block mb-2">꿈의 상징과 매칭된 행운의 6개 번호</span>
                <div className="flex justify-center gap-1.5">
                  {dreamResult.numbers.map((n) => (
                    <span key={n} className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${getLottoBallColor(n)}`}>{n}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onCopy(dreamResult.numbers)}
                  className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  클립보드 복사
                </button>
                <button
                  onClick={onSaveDreamNumbers}
                  disabled={dreamSaveSuccess}
                  className={`flex-1 py-2 rounded text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all ${
                    dreamSaveSuccess ? "bg-emerald-950 border-emerald-900 text-emerald-400 border" : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {dreamSaveSuccess ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> 보관함 저장 완료</>
                  ) : (
                    <><Bookmark className="w-3.5 h-3.5" /> 보관함에 저장하기</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 해몽 히스토리 */}
      {isSupabaseConfigured && (
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">내 해몽 히스토리</h3>
            {dreamHistoryLoading && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
          </div>
          {dreamHistory.length === 0 && !dreamHistoryLoading ? (
            <p className="text-xs text-slate-600 py-3 text-center">저장된 해몽 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {dreamHistory.map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-slate-400 line-clamp-2 flex-1">{log.dream_text}</p>
                    <span className="text-[10px] text-slate-600 shrink-0">
                      {new Date(log.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(log.keywords ?? []).map((kw, i) => (
                      <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/60">#{kw}</span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {(log.numbers ?? []).map((n) => (
                      <span key={n} className={`w-6 h-6 rounded-full text-[10px] font-extrabold flex items-center justify-center ${getLottoBallColor(n)}`}>{n}</span>
                    ))}
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
