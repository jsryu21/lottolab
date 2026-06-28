"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BarChart2, Users, Megaphone, Brain, LogOut, RefreshCw,
  Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, Shield,
} from "lucide-react";
import { getLottoBallColor } from "@/lib/getLottoBallColor";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "jsryu21@naver.com";
const GA4_URL = "https://analytics.google.com/analytics/web/#/p468773636/reports/intelligenthome";

type Tab = "stats" | "users" | "notices" | "dreams";

interface StatsData {
  authUserCount: number; totalSaves: number; totalDreams: number;
  todaySaves: number; todayDreams: number; totalNotices: number;
}
interface AdminUser {
  id: string; email: string; created_at: string;
  last_sign_in_at: string | null; email_confirmed_at: string | null;
}
interface Notice {
  id: string; title: string; content: string; is_active: boolean; created_at: string;
}
interface DreamLog {
  id: string; user_email: string; dream_text: string;
  keywords: string[]; numbers: number[]; created_at: string;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("stats");

  // 데이터
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dreamLogs, setDreamLogs] = useState<DreamLog[]>([]);

  // 공지 폼
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 로딩
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, [user]);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { headers: authHeaders });
    if (res.ok) setStats(await res.json());
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users", { headers: authHeaders });
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notices", { headers: authHeaders });
    if (res.ok) { const d = await res.json(); setNotices(d.notices); }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDreamLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/dream-logs", { headers: authHeaders });
    if (res.ok) { const d = await res.json(); setDreamLogs(d.logs); }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "stats") fetchStats();
    if (tab === "users") fetchUsers();
    if (tab === "notices") fetchNotices();
    if (tab === "dreams") fetchDreamLogs();
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateNotice = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    if (res.ok) { setNewTitle(""); setNewContent(""); fetchNotices(); }
  };

  const handleToggleNotice = async (id: string, current: boolean) => {
    await fetch("/api/admin/notices", {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchNotices();
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("공지를 삭제하시겠습니까?")) return;
    await fetch("/api/admin/notices", {
      method: "DELETE",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotices();
  };

  // 접근 제한
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <Shield className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-500">로그인이 필요합니다.</p>
      </div>
    </div>
  );

  if (user.email !== ADMIN_EMAIL) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <Shield className="w-10 h-10 text-rose-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-500">관리자 권한이 없습니다.</p>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "stats", label: "통계", icon: BarChart2 },
    { id: "users", label: "사용자", icon: Users },
    { id: "notices", label: "공지사항", icon: Megaphone },
    { id: "dreams", label: "해몽 로그", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">LottoLab 관리자</h1>
            <p className="text-[10px] text-slate-400">{user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-all">
          <LogOut className="w-3.5 h-3.5" />나가기
        </button>
      </header>

      {/* 탭 */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                tab === id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── 통계 ── */}
        {tab === "stats" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">서비스 현황</h2>
              <div className="flex gap-2">
                <a href={GA4_URL} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                  <ExternalLink className="w-3 h-3" />Google Analytics
                </a>
                <button onClick={fetchStats} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 transition-all">
                  <RefreshCw className="w-3 h-3" />새로고침
                </button>
              </div>
            </div>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "가입 사용자", value: stats.authUserCount, sub: "전체", color: "text-indigo-600" },
                  { label: "저장된 번호", value: stats.totalSaves, sub: "전체", color: "text-emerald-600" },
                  { label: "AI 해몽", value: stats.totalDreams, sub: "전체", color: "text-violet-600" },
                  { label: "오늘 저장", value: stats.todaySaves, sub: "today", color: "text-amber-600" },
                  { label: "오늘 해몽", value: stats.todayDreams, sub: "today", color: "text-orange-600" },
                  { label: "공지사항", value: stats.totalNotices, sub: "등록됨", color: "text-slate-600" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                    <p className={`text-2xl font-extrabold ${color}`}>{value.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
            )}
          </div>
        )}

        {/* ── 사용자 ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">사용자 목록 <span className="text-slate-400 font-normal">({users.length}명)</span></h2>
              <button onClick={fetchUsers} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 transition-all">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />새로고침
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">이메일</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 hidden sm:table-cell">가입일</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 hidden md:table-cell">마지막 로그인</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-500">인증</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.email_confirmed_at
                          ? <span className="text-emerald-600 font-bold">✓</span>
                          : <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">사용자 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 공지사항 ── */}
        {tab === "notices" && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-900">공지사항 관리</h2>

            {/* 새 공지 작성 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />새 공지 작성
              </h3>
              <input
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="제목"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-400"
              />
              <textarea
                value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder="내용"
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-400 resize-none"
              />
              <button onClick={handleCreateNotice}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white text-xs font-bold rounded-xl transition-all">
                게시
              </button>
            </div>

            {/* 공지 목록 */}
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${n.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {n.is_active ? "게시중" : "비활성"}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{new Date(n.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleToggleNotice(n.id, n.is_active)} title={n.is_active ? "비활성화" : "활성화"}
                      className="p-1.5 rounded-lg hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600">
                      {n.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDeleteNotice(n.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {notices.length === 0 && !loading && (
                <p className="text-center text-sm text-slate-400 py-8">등록된 공지사항이 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* ── 해몽 로그 ── */}
        {tab === "dreams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">AI 해몽 로그 <span className="text-slate-400 font-normal">({dreamLogs.length}건)</span></h2>
              <button onClick={fetchDreamLogs} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-400 transition-all">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />새로고침
              </button>
            </div>
            <div className="space-y-3">
              {dreamLogs.map((log) => (
                <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-600">{log.user_email}</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{log.dream_text}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(log.keywords ?? []).map((kw, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100">#{kw}</span>
                      ))}
                    </div>
                    <div className="flex gap-1 ml-auto">
                      {(log.numbers ?? []).map((n) => (
                        <span key={n} className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${getLottoBallColor(n)}`}>{n}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {dreamLogs.length === 0 && !loading && (
                <p className="text-center text-sm text-slate-400 py-8">해몽 로그가 없습니다.</p>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
