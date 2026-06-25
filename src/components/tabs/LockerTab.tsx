"use client";

import { FolderHeart, Bookmark, Copy, Trash2, Calendar } from "lucide-react";
import { SavedNumber, calculateOddEven, calculateSum } from "@/lib/lotto";
import { getLottoBallColor } from "@/lib/getLottoBallColor";
import LoginGateCard from "@/components/LoginGateCard";

interface LockerTabProps {
  user: { id: string; email: string } | null;
  savedNumbers: SavedNumber[];
  lockerLoading: boolean;
  editingMemoId: string | null;
  memoText: string;
  setMemoText: (text: string) => void;
  setEditingMemoId: (id: string | null) => void;
  onLoginGate: () => void;
  onCopy: (numbers: number[]) => void;
  onDelete: (id: string) => void;
  onUpdateMemo: (id: string) => void;
}

export default function LockerTab({
  user,
  savedNumbers,
  lockerLoading,
  editingMemoId,
  memoText,
  setMemoText,
  setEditingMemoId,
  onLoginGate,
  onCopy,
  onDelete,
  onUpdateMemo,
}: LockerTabProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <FolderHeart className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-base">내 번호 보관함</h2>
        </div>
        <span className="text-xs text-slate-400">총 {savedNumbers.length}개 보관 중</span>
      </div>

      {!user ? (
        <LoginGateCard tab="locker" onLogin={onLoginGate} />
      ) : lockerLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">보관된 번호를 불러오고 있습니다...</div>
      ) : savedNumbers.length === 0 ? (
        <div className="py-12 text-center max-w-sm mx-auto space-y-3">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <div>
            <h3 className="font-bold text-sm mb-1">보관된 번호 없음</h3>
            <p className="text-xs text-slate-400">
              생성기 탭이나 꿈 해몽 AI 탭에서 생성된 행운의 로또 번호를 보관함에 추가해 보세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedNumbers.map((item) => {
            const { odd, even } = calculateOddEven(item.numbers);
            const sum = calculateSum(item.numbers);
            const dateFormatted = new Date(item.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric", month: "2-digit", day: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3 shadow-inner hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.numbers.map((n) => (
                      <span key={n} className={`w-7 h-7 rounded-full border text-[11px] font-extrabold flex items-center justify-center shadow-inner ${getLottoBallColor(n)}`}>
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => onCopy(item.numbers)} title="복사" className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(item.id)} title="삭제" className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[10px] text-slate-400 bg-slate-900/40 p-1.5 rounded border border-slate-900/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {dateFormatted}
                  </span>
                  <span>합계: {sum}</span>
                  <span>홀짝: {odd}:{even}</span>
                </div>

                <div>
                  {editingMemoId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        placeholder="메모 입력..."
                      />
                      <button onClick={() => onUpdateMemo(item.id)} className="px-2.5 py-1 bg-blue-600 rounded text-[10px] font-bold text-white shrink-0">저장</button>
                      <button onClick={() => setEditingMemoId(null)} className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300 shrink-0">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                      <span className="truncate italic text-slate-400">{item.memo || "메모 기록이 없습니다."}</span>
                      <button
                        onClick={() => { setEditingMemoId(item.id); setMemoText(item.memo || ""); }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0 font-semibold"
                      >
                        {item.memo ? "수정" : "메모 추가"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
