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
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FolderHeart className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-bold text-sm text-slate-900">내 번호 보관함</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{savedNumbers.length}개 보관 중</span>
        </div>

        {!user ? (
          <LoginGateCard tab="locker" onLogin={onLoginGate} />
        ) : lockerLoading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">불러오는 중...</p>
          </div>
        ) : savedNumbers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
              <Bookmark className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-700 mb-1">보관된 번호가 없습니다</h3>
              <p className="text-xs text-slate-400">생성기 또는 꿈 해몽 탭에서 번호를 저장해보세요.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedNumbers.map((item) => {
              const { odd, even } = calculateOddEven(item.numbers);
              const sum = calculateSum(item.numbers);
              const dateFormatted = new Date(item.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric", month: "2-digit", day: "2-digit",
              });
              return (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.numbers.map((n) => (
                        <span key={n} className={`w-8 h-8 rounded-full border-2 text-[11px] font-extrabold flex items-center justify-center shadow-sm ${getLottoBallColor(n)}`}>{n}</span>
                      ))}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => onCopy(item.numbers)} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-all">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white rounded-lg p-2 border border-slate-200">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{dateFormatted}</span>
                    <span className="text-slate-300">|</span>
                    <span>합계 {sum}</span>
                    <span className="text-slate-300">|</span>
                    <span>홀짝 {odd}:{even}</span>
                  </div>

                  <div>
                    {editingMemoId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="text" value={memoText} onChange={(e) => setMemoText(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                          placeholder="메모 입력..." />
                        <button onClick={() => onUpdateMemo(item.id)} className="px-2.5 py-1.5 bg-indigo-600 rounded-lg text-[10px] font-bold text-white shrink-0">저장</button>
                        <button onClick={() => setEditingMemoId(null)} className="px-2 py-1.5 bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shrink-0">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate italic text-slate-400">{item.memo || "메모 없음"}</span>
                        <button onClick={() => { setEditingMemoId(item.id); setMemoText(item.memo || ""); }}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 shrink-0 font-semibold">
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
    </div>
  );
}
