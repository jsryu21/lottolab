"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  generateLottoNumbers,
  LottoFilters,
  SavedNumber,
  LottoDraw,
  mockLottoDraws,
  checkHistoricalPerformance,
  PerformanceReport,
} from "@/lib/lotto";
import {
  Dices,
  FolderHeart,
  TrendingUp,
  Brain,
  Play,
  KeyRound,
  LogOut,
  AlertCircle,
  User,
  Lock,
  ChevronDown,
} from "lucide-react";
import StatsTab from "@/components/tabs/StatsTab";
import LockerTab from "@/components/tabs/LockerTab";
import DreamTab from "@/components/tabs/DreamTab";
import GeneratorTab from "@/components/tabs/GeneratorTab";
import SimulatorTab from "@/components/tabs/SimulatorTab";
import AuthModal from "@/components/modals/AuthModal";
import ReportModal from "@/components/modals/ReportModal";

export default function LottoLabDashboard({ initialDraws }: { initialDraws: LottoDraw[] }) {
  const { user, isLoading: authLoading, isLocalMode, login, signUp, verifyOtp, resendOtp, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"generator" | "locker" | "stats" | "simulator" | "dream">("generator");
  const [pendingTab, setPendingTab] = useState<typeof activeTab | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authStep, setAuthStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 1. 번호 생성기 상태
  const [gridModes, setGridModes] = useState<Record<number, "fixed" | "excluded" | "none">>({});
  const [oddEvenRatio, setOddEvenRatio] = useState<string>("all");
  const [sumPreset, setSumPreset] = useState<"all" | "recommended" | "custom">("recommended");
  const [customMinSum, setCustomMinSum] = useState<number>(100);
  const [customMaxSum, setCustomMaxSum] = useState<number>(150);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [generatedSets, setGeneratedSets] = useState<number[][]>([]);
  const [justSavedIndex, setJustSavedIndex] = useState<number | null>(null);
  const [consecutiveLimit, setConsecutiveLimit] = useState<number>(0);
  const [endingSumPreset, setEndingSumPreset] = useState<"all" | "recommended" | "custom">("all");
  const [customMinEndingSum, setCustomMinEndingSum] = useState<number>(15);
  const [customMaxEndingSum, setCustomMaxEndingSum] = useState<number>(35);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const [reportTargetSet, setReportTargetSet] = useState<number[] | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);

  // 2. 보관함
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [lockerLoading, setLockerLoading] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  // 3. 통계
  const [draws, setDraws] = useState<LottoDraw[]>(initialDraws);
  const [isFetchingDraws, setIsFetchingDraws] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const crawlAttempted = useRef(false);

  // 4. 시뮬레이터
  const [selectedSimSet, setSelectedSimSet] = useState<number[] | null>(null);
  const [simBudget, setSimBudget] = useState<number>(100000);
  const [simMode, setSimMode] = useState<"historical" | "montecarlo">("historical");
  const [simResults, setSimResults] = useState<{
    ran: boolean; totalSpent: number; totalWon: number; roi: number;
    matches: { first: number; second: number; third: number; fourth: number; fifth: number; none: number; };
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // 5. 꿈 해몽 AI
  const [dreamInput, setDreamInput] = useState("");
  const [dreamLoading, setDreamLoading] = useState(false);
  const [dreamResult, setDreamResult] = useState<{
    interpretation: string; keywords: string[]; numbers: number[]; isRealAi: boolean;
  } | null>(null);
  const [dreamSaveSuccess, setDreamSaveSuccess] = useState(false);
  const [dreamHistory, setDreamHistory] = useState<Array<{
    id: string; dream_text: string; interpretation: string; keywords: string[];
    numbers: number[]; created_at: string;
  }>>([]);
  const [dreamHistoryLoading, setDreamHistoryLoading] = useState(false);

  const getFixedNumbers = useCallback(() =>
    Object.entries(gridModes).filter(([_, m]) => m === "fixed").map(([n]) => parseInt(n, 10)).sort((a, b) => a - b),
  [gridModes]);

  const getExcludedNumbers = useCallback(() =>
    Object.entries(gridModes).filter(([_, m]) => m === "excluded").map(([n]) => parseInt(n, 10)).sort((a, b) => a - b),
  [gridModes]);

  const loadSavedNumbers = useCallback(async () => {
    if (authLoading) return;
    setLockerLoading(true);
    if (isLocalMode) {
      const stored = localStorage.getItem("lottolab_saved");
      setSavedNumbers(stored ? (() => { try { return JSON.parse(stored); } catch { return []; } })() : []);
      setLockerLoading(false);
    } else {
      if (!user) { setSavedNumbers([]); setLockerLoading(false); return; }
      try {
        const { data, error } = await supabase.from("saved_numbers").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setSavedNumbers((data || []).map((row) => ({ id: row.id, numbers: row.numbers, createdAt: row.created_at, memo: row.memo || undefined })));
      } catch (err) {
        console.error(err);
        toast.error("보관함을 불러오지 못했습니다.");
      } finally { setLockerLoading(false); }
    }
  }, [user, isLocalMode, authLoading]);

  const loadLottoDraws = useCallback(async () => {
    if (isLocalMode) { setDraws(mockLottoDraws); return; }
    setIsFetchingDraws(true);
    try {
      const { data, error } = await supabase.from("draws").select("*").order("drw_no", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setDraws(data.map((d) => ({ drwNo: Number(d.drw_no), drwNoDate: d.drw_no_date, no1: d.no1, no2: d.no2, no3: d.no3, no4: d.no4, no5: d.no5, no6: d.no6, bonusNo: d.bonus_no, totSellAmnt: d.tot_sell_amnt ? Number(d.tot_sell_amnt) : undefined, firstWinAmnt: d.first_win_amnt ? Number(d.first_win_amnt) : undefined, firstPrzWnerCo: d.first_prz_wner_co ? Number(d.first_prz_wner_co) : undefined })));
        setIsUsingMockData(false);
      } else {
        setDraws(mockLottoDraws); setIsUsingMockData(true);
        if (!crawlAttempted.current) { crawlAttempted.current = true; fetch("/api/crawl").then(() => loadLottoDraws()).catch(() => {}); }
      }
    } catch { setDraws(mockLottoDraws); setIsUsingMockData(true); }
    finally { setIsFetchingDraws(false); }
  }, [isLocalMode]);

  useEffect(() => { if (otpCountdown <= 0) return; const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000); return () => clearTimeout(t); }, [otpCountdown]);
  useEffect(() => { if (otpResendCooldown <= 0) return; const t = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000); return () => clearTimeout(t); }, [otpResendCooldown]);

  const formatCountdown = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

  const resetAuthModal = () => {
    setShowAuthModal(false); setAuthError(""); setAuthSuccessMsg(""); setAuthStep("form"); setOtpCode(""); setOtpCountdown(0); setOtpResendCooldown(0);
  };

  useEffect(() => { loadSavedNumbers(); loadLottoDraws(); }, [loadSavedNumbers, loadLottoDraws, user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(""); setAuthSuccessMsg(""); setAuthPending(true);
    try {
      if (isSignUpMode) {
        const res = await signUp(authEmail, authPassword);
        if (res.success) {
          if (isLocalMode) { setAuthSuccessMsg("로컬 계정 생성 완료. 자동 로그인됩니다."); setTimeout(() => { resetAuthModal(); setAuthEmail(""); setAuthPassword(""); }, 1500); }
          else if (res.requiresOtp) { setAuthStep("otp"); setOtpCountdown(600); setOtpResendCooldown(60); }
        } else setAuthError(res.error || "회원가입에 실패했습니다.");
      } else {
        const res = await login(authEmail, authPassword);
        if (res.success) {
          setAuthSuccessMsg("로그인되었습니다.");
          setTimeout(() => { resetAuthModal(); setAuthEmail(""); setAuthPassword(""); if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null); } }, 1000);
        } else setAuthError(res.error || "이메일 또는 비밀번호가 잘못되었습니다.");
      }
    } catch { setAuthError("오류가 발생했습니다. 다시 시도해 주세요."); }
    finally { setAuthPending(false); }
  };

  const handleOtpVerify = async () => {
    if (otpCode.length !== 6) { setAuthError("6자리 인증 코드를 입력해 주세요."); return; }
    setAuthPending(true); setAuthError("");
    try {
      const res = await verifyOtp(authEmail, otpCode);
      if (res.success) { setAuthSuccessMsg("인증 완료!"); setTimeout(() => { resetAuthModal(); setAuthEmail(""); setAuthPassword(""); }, 1200); }
      else setAuthError(res.error || "인증 코드가 올바르지 않습니다.");
    } catch { setAuthError("오류가 발생했습니다."); }
    finally { setAuthPending(false); }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return; setAuthPending(true); setAuthError("");
    try {
      const res = await resendOtp(authEmail);
      if (res.success) { setOtpCountdown(600); setOtpResendCooldown(60); setAuthSuccessMsg("재발송했습니다."); setTimeout(() => setAuthSuccessMsg(""), 3000); }
      else setAuthError(res.error || "재발송에 실패했습니다.");
    } catch { setAuthError("오류가 발생했습니다."); }
    finally { setAuthPending(false); }
  };

  const handleGenerate = () => {
    const fixed = getFixedNumbers(); const excluded = getExcludedNumbers();
    let sumRange = null;
    if (sumPreset === "recommended") sumRange = { min: 100, max: 150 };
    else if (sumPreset === "custom") sumRange = { min: customMinSum, max: customMaxSum };
    let endingSumRange = null;
    if (endingSumPreset === "recommended") endingSumRange = { min: 15, max: 35 };
    else if (endingSumPreset === "custom") endingSumRange = { min: customMinEndingSum, max: customMaxEndingSum };
    const filters: LottoFilters = { fixedNumbers: fixed, excludedNumbers: excluded, oddEvenRatio, sumRange, consecutiveLimit, endingSumRange };
    setGeneratedSets(generateLottoNumbers(generateCount, filters));
    setJustSavedIndex(null);
  };

  const handleSaveNumber = async (numbers: number[], index?: number) => {
    if (!user) { setShowAuthModal(true); return; }
    const sortedNew = [...numbers].sort((a, b) => a - b).join(",");
    if (savedNumbers.some((s) => [...s.numbers].sort((a, b) => a - b).join(",") === sortedNew)) { toast("이미 보관된 번호 조합입니다."); return; }
    if (isLocalMode) {
      const currentList: SavedNumber[] = (() => { try { return JSON.parse(localStorage.getItem("lottolab_saved") || "[]"); } catch { return []; } })();
      const newNum: SavedNumber = { id: Math.random().toString(36).substring(2, 9), numbers, createdAt: new Date().toISOString() };
      const updated = [newNum, ...currentList];
      localStorage.setItem("lottolab_saved", JSON.stringify(updated)); setSavedNumbers(updated);
      if (index !== undefined) { setJustSavedIndex(index); setTimeout(() => setJustSavedIndex(null), 2000); }
    } else {
      try {
        const { error } = await supabase.from("saved_numbers").insert({ user_id: user.id, numbers, memo: "" });
        if (error) throw error;
        await loadSavedNumbers();
        if (index !== undefined) { setJustSavedIndex(index); setTimeout(() => setJustSavedIndex(null), 2000); }
      } catch { toast.error("번호를 저장하지 못했습니다."); }
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (isLocalMode) { const updated = savedNumbers.filter((n) => n.id !== id); localStorage.setItem("lottolab_saved", JSON.stringify(updated)); setSavedNumbers(updated); }
    else { try { const { error } = await supabase.from("saved_numbers").delete().eq("id", id); if (error) throw error; await loadSavedNumbers(); } catch { toast.error("삭제에 실패했습니다."); } }
  };

  const handleUpdateMemo = async (id: string) => {
    if (isLocalMode) { const updated = savedNumbers.map((n) => n.id === id ? { ...n, memo: memoText } : n); localStorage.setItem("lottolab_saved", JSON.stringify(updated)); setSavedNumbers(updated); setEditingMemoId(null); }
    else { try { const { error } = await supabase.from("saved_numbers").update({ memo: memoText }).eq("id", id); if (error) throw error; await loadSavedNumbers(); setEditingMemoId(null); } catch { toast.error("메모 저장에 실패했습니다."); } }
  };

  const handleGridClick = (num: number) => {
    const currentMode = gridModes[num] || "none";
    let nextMode: "fixed" | "excluded" | "none" = "none";
    if (currentMode === "none") { nextMode = getFixedNumbers().length >= 5 ? "excluded" : "fixed"; }
    else if (currentMode === "fixed") nextMode = "excluded";
    setGridModes((prev) => ({ ...prev, [num]: nextMode }));
  };

  const handleResetGrid = () => { setGridModes({}); setOddEvenRatio("all"); setSumPreset("recommended"); setConsecutiveLimit(0); setEndingSumPreset("all"); setGeneratedSets([]); };
  const handleOpenReport = (set: number[]) => { setReportTargetSet(set); setPerformanceReport(checkHistoricalPerformance(set, draws)); };

  const runSimulation = () => {
    if (!selectedSimSet) return; setIsSimulating(true);
    setTimeout(() => {
      const matches = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, none: 0 };
      let totalWon = 0; let totalSpent = 0;
      const countMatch = (winningNumbers: number[], bonusNo: number) => {
        const mc = selectedSimSet!.filter((n) => winningNumbers.includes(n)).length;
        const mb = selectedSimSet!.includes(bonusNo);
        if (mc === 6) { matches.first++; totalWon += 2_000_000_000; }
        else if (mc === 5 && mb) { matches.second++; totalWon += 60_000_000; }
        else if (mc === 5) { matches.third++; totalWon += 1_500_000; }
        else if (mc === 4) { matches.fourth++; totalWon += 50_000; }
        else if (mc === 3) { matches.fifth++; totalWon += 5_000; }
        else { matches.none++; }
      };
      const randomDraw = (): { winning: number[]; bonus: number } => {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1); const winning: number[] = [];
        for (let j = 0; j < 6; j++) { const idx = Math.floor(Math.random() * pool.length); winning.push(pool.splice(idx, 1)[0]); }
        return { winning: winning.sort((a, b) => a - b), bonus: pool[Math.floor(Math.random() * pool.length)] };
      };
      if (simMode === "historical") { for (const d of draws) countMatch([d.no1, d.no2, d.no3, d.no4, d.no5, d.no6], d.bonusNo); totalSpent = draws.length * 1000; }
      else { const gameCount = Math.floor(simBudget / 1000); for (let i = 0; i < gameCount; i++) { const { winning, bonus } = randomDraw(); countMatch(winning, bonus); } totalSpent = simBudget; }
      setSimResults({ ran: true, totalSpent, totalWon, roi: totalSpent > 0 ? (totalWon / totalSpent) * 100 : 0, matches });
      setIsSimulating(false);
    }, 800);
  };

  const loadDreamHistory = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return; setDreamHistoryLoading(true);
    try {
      const { data, error } = await supabase.from("dream_logs").select("id, dream_text, interpretation, keywords, numbers, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (!error && data) setDreamHistory(data as typeof dreamHistory);
    } catch {} finally { setDreamHistoryLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "dream" && user?.id) loadDreamHistory(user.id); }, [activeTab, user, loadDreamHistory]);

  const handleDreamInterpret = async () => {
    if (!dreamInput.trim()) return; setDreamLoading(true); setDreamSaveSuccess(false); setDreamResult(null);
    try {
      const res = await fetch("/api/dream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dreamText: dreamInput, userId: user?.id }) });
      if (!res.ok) throw new Error();
      setDreamResult(await res.json()); if (user?.id) loadDreamHistory(user.id);
    } catch { toast.error("꿈 해몽 처리 중 오류가 발생했습니다."); }
    finally { setDreamLoading(false); }
  };

  const handleSaveDreamNumbers = async () => { if (!dreamResult) return; await handleSaveNumber(dreamResult.numbers); setDreamSaveSuccess(true); setTimeout(() => setDreamSaveSuccess(false), 3000); };
  const handleCopyToClipboard = (nums: number[]) => { navigator.clipboard.writeText(nums.join(", ")); toast.success(`번호 [${nums.join(", ")}] 복사됨`, { duration: 2000 }); };

  const statsData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) counts[i] = 0;
    let totalOdd = 0; let totalEven = 0;
    draws.forEach((d) => { [d.no1, d.no2, d.no3, d.no4, d.no5, d.no6].forEach((n) => { counts[n] = (counts[n] || 0) + 1; if (n % 2 === 0) totalEven++; else totalOdd++; }); });
    const frequencyList = Object.entries(counts).map(([num, count]) => ({ num: parseInt(num, 10), count }));
    return {
      topNumbers: [...frequencyList].sort((a, b) => b.count - a.count).slice(0, 10),
      bottomNumbers: [...frequencyList].sort((a, b) => a.count - b.count).slice(0, 10),
      oddPct: Math.round((totalOdd / (totalOdd + totalEven || 1)) * 100),
      evenPct: Math.round((totalEven / (totalOdd + totalEven || 1)) * 100),
      allFrequency: frequencyList,
    };
  }, [draws]);

  const TAB_NAV = [
    { id: "generator" as const, icon: Dices, label: "번호 생성", gated: false },
    { id: "locker" as const, icon: FolderHeart, label: "보관함", gated: true },
    { id: "stats" as const, icon: TrendingUp, label: "통계", gated: true },
    { id: "simulator" as const, icon: Play, label: "모의 투자", gated: true },
    { id: "dream" as const, icon: Brain, label: "꿈 해몽", gated: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 16V12" /><path d="M12 16V8" /><path d="M16 16V10" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">LottoLab</span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">데이터 기반 로또 분석</p>
            </div>
          </div>

          {/* User Auth */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <span className="text-xs text-slate-400">로딩 중...</span>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-700"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[80px] truncate">{user.email.split("@")[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setAuthError(""); setAuthSuccessMsg(""); setShowAuthModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-5 pb-28">

        {/* Local Mode Banner */}
        {isLocalMode && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">로컬 브라우저 저장 모드로 동작 중입니다.</span>
              `.env.local`에 Supabase 설정을 추가하면 서버 저장 및 AI 해몽 기능이 활성화됩니다.
            </div>
          </div>
        )}

        {activeTab === "generator" && (
          <GeneratorTab
            user={user}
            gridModes={gridModes}
            fixedNumbers={getFixedNumbers()}
            excludedNumbers={getExcludedNumbers()}
            oddEvenRatio={oddEvenRatio}
            sumPreset={sumPreset}
            customMinSum={customMinSum}
            customMaxSum={customMaxSum}
            generateCount={generateCount}
            generatedSets={generatedSets}
            justSavedIndex={justSavedIndex}
            showAdvancedFilters={showAdvancedFilters}
            consecutiveLimit={consecutiveLimit}
            endingSumPreset={endingSumPreset}
            customMinEndingSum={customMinEndingSum}
            customMaxEndingSum={customMaxEndingSum}
            setOddEvenRatio={setOddEvenRatio}
            setSumPreset={setSumPreset}
            setCustomMinSum={setCustomMinSum}
            setCustomMaxSum={setCustomMaxSum}
            setGenerateCount={setGenerateCount}
            setShowAdvancedFilters={setShowAdvancedFilters}
            setConsecutiveLimit={setConsecutiveLimit}
            setEndingSumPreset={setEndingSumPreset}
            setCustomMinEndingSum={setCustomMinEndingSum}
            setCustomMaxEndingSum={setCustomMaxEndingSum}
            onGridClick={handleGridClick}
            onResetGrid={handleResetGrid}
            onGenerate={handleGenerate}
            onCopy={handleCopyToClipboard}
            onOpenReport={handleOpenReport}
            onSaveNumber={handleSaveNumber}
            onLoginGate={() => { setPendingTab(null); setShowAuthModal(true); }}
          />
        )}

        {activeTab === "locker" && (
          <LockerTab
            user={user}
            savedNumbers={savedNumbers}
            lockerLoading={lockerLoading}
            editingMemoId={editingMemoId}
            memoText={memoText}
            setMemoText={setMemoText}
            setEditingMemoId={setEditingMemoId}
            onLoginGate={() => { setPendingTab("locker"); setShowAuthModal(true); }}
            onCopy={handleCopyToClipboard}
            onDelete={handleDeleteNumber}
            onUpdateMemo={handleUpdateMemo}
          />
        )}

        {activeTab === "stats" && (
          <StatsTab
            user={user}
            draws={draws}
            statsData={statsData}
            isUsingMockData={isUsingMockData}
            isFetchingDraws={isFetchingDraws}
            onLoginGate={() => { setPendingTab("stats"); setShowAuthModal(true); }}
          />
        )}

        {activeTab === "simulator" && (
          <SimulatorTab
            user={user}
            savedNumbers={savedNumbers}
            selectedSimSet={selectedSimSet}
            simBudget={simBudget}
            simMode={simMode}
            simResults={simResults}
            isSimulating={isSimulating}
            setSelectedSimSet={setSelectedSimSet}
            setSimBudget={setSimBudget}
            setSimMode={setSimMode}
            setSimResults={setSimResults}
            onRunSimulation={runSimulation}
            onLoginGate={() => { setPendingTab("simulator"); setShowAuthModal(true); }}
          />
        )}

        {activeTab === "dream" && (
          <DreamTab
            user={user}
            dreamInput={dreamInput}
            setDreamInput={setDreamInput}
            dreamLoading={dreamLoading}
            dreamResult={dreamResult}
            dreamSaveSuccess={dreamSaveSuccess}
            dreamHistory={dreamHistory}
            dreamHistoryLoading={dreamHistoryLoading}
            isSupabaseConfigured={isSupabaseConfigured}
            onLoginGate={() => { setPendingTab("dream"); setShowAuthModal(true); }}
            onInterpret={handleDreamInterpret}
            onCopy={handleCopyToClipboard}
            onSaveDreamNumbers={handleSaveDreamNumbers}
            onSaveHistoryNumbers={(numbers) => handleSaveNumber(numbers)}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex items-center justify-around px-2 py-1">
          {TAB_NAV.map(({ id, icon: Icon, label, gated }) => {
            const isActive = activeTab === id;
            const isLocked = gated && !user;
            return (
              <button
                key={id}
                onClick={() => {
                  if (isLocked) { setPendingTab(id); setShowAuthModal(true); return; }
                  setActiveTab(id);
                }}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-[56px] ${
                  isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {isActive && <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isLocked && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-200 border border-white flex items-center justify-center">
                      <Lock className="w-1.5 h-1.5 text-slate-400" />
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? "text-indigo-600" : ""}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer (데스크탑에서만 표시) */}
      <div className="hidden md:block h-16" />
      <footer className="hidden md:block bg-white border-t border-slate-200 py-5 px-6 text-center text-xs text-slate-400 mb-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-slate-600">LottoLab &copy; 2026</span>
          <p className="max-w-md text-slate-400 text-[11px] leading-4">
            로또는 1인당 10만원 한도 내에서 건전하게 즐기는 오락입니다. 당첨 예측은 통계적 연구 목적이며 실제 당첨을 보장하지 않습니다.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isSignUpMode={isSignUpMode}
          authEmail={authEmail}
          authPassword={authPassword}
          authError={authError}
          authSuccessMsg={authSuccessMsg}
          authPending={authPending}
          authStep={authStep}
          otpCode={otpCode}
          otpCountdown={otpCountdown}
          otpResendCooldown={otpResendCooldown}
          isLocalMode={isLocalMode}
          setIsSignUpMode={setIsSignUpMode}
          setAuthEmail={setAuthEmail}
          setAuthPassword={setAuthPassword}
          setAuthError={setAuthError}
          setOtpCode={setOtpCode}
          onClose={resetAuthModal}
          onSubmit={handleAuthSubmit}
          onOtpVerify={handleOtpVerify}
          onResendOtp={handleResendOtp}
          formatCountdown={formatCountdown}
          onBackToForm={() => { setAuthStep("form"); setAuthError(""); setOtpCode(""); }}
        />
      )}

      {/* Report Modal */}
      {reportTargetSet && performanceReport && (
        <ReportModal
          reportTargetSet={reportTargetSet}
          performanceReport={performanceReport}
          onClose={() => { setReportTargetSet(null); setPerformanceReport(null); }}
        />
      )}

      {/* 유저 메뉴 외부 클릭 닫기 */}
      {showUserMenu && <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />}
    </div>
  );
}
