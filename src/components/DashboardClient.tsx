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

  // UI 상태 관리
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

  // 1.5 성적표 모달 관련 상태
  const [reportTargetSet, setReportTargetSet] = useState<number[] | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);

  // 2. 보관함 상태
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [lockerLoading, setLockerLoading] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  // 3. 통계 및 역사 데이터 상태
  const [draws, setDraws] = useState<LottoDraw[]>(initialDraws);
  const [isFetchingDraws, setIsFetchingDraws] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const crawlAttempted = useRef(false);

  // 4. 시뮬레이터 상태
  const [selectedSimSet, setSelectedSimSet] = useState<number[] | null>(null);
  const [simBudget, setSimBudget] = useState<number>(100000);
  const [simMode, setSimMode] = useState<"historical" | "montecarlo">("historical");
  const [simResults, setSimResults] = useState<{
    ran: boolean;
    totalSpent: number;
    totalWon: number;
    roi: number;
    matches: {
      first: number;
      second: number;
      third: number;
      fourth: number;
      fifth: number;
      none: number;
    };
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // 5. 꿈 해몽 AI 상태
  const [dreamInput, setDreamInput] = useState("");
  const [dreamLoading, setDreamLoading] = useState(false);
  const [dreamResult, setDreamResult] = useState<{
    interpretation: string;
    keywords: string[];
    numbers: number[];
    isRealAi: boolean;
  } | null>(null);
  const [dreamSaveSuccess, setDreamSaveSuccess] = useState(false);
  const [dreamHistory, setDreamHistory] = useState<Array<{
    id: string;
    dream_text: string;
    interpretation: string;
    keywords: string[];
    numbers: number[];
    created_at: string;
  }>>([]);
  const [dreamHistoryLoading, setDreamHistoryLoading] = useState(false);

  // --- 헬퍼 함수: 고정수/제외수 리스트 추출 ---
  const getFixedNumbers = useCallback(() => {
    return Object.entries(gridModes)
      .filter(([_, mode]) => mode === "fixed")
      .map(([num]) => parseInt(num, 10))
      .sort((a, b) => a - b);
  }, [gridModes]);

  const getExcludedNumbers = useCallback(() => {
    return Object.entries(gridModes)
      .filter(([_, mode]) => mode === "excluded")
      .map(([num]) => parseInt(num, 10))
      .sort((a, b) => a - b);
  }, [gridModes]);

  // --- 데이터로드: 보관함 조회 ---
  const loadSavedNumbers = useCallback(async () => {
    if (authLoading) return;
    setLockerLoading(true);

    if (isLocalMode) {
      const stored = localStorage.getItem("lottolab_saved");
      if (stored) {
        try {
          setSavedNumbers(JSON.parse(stored));
        } catch {
          setSavedNumbers([]);
        }
      } else {
        setSavedNumbers([]);
      }
      setLockerLoading(false);
    } else {
      if (!user) {
        setSavedNumbers([]);
        setLockerLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("saved_numbers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: SavedNumber[] = (data || []).map((row) => ({
          id: row.id,
          numbers: row.numbers,
          createdAt: row.created_at,
          memo: row.memo || undefined,
        }));
        setSavedNumbers(mapped);
      } catch (err) {
        console.error("DB saved numbers fetch error:", err);
        toast.error("보관함을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLockerLoading(false);
      }
    }
  }, [user, isLocalMode, authLoading]);

  // --- 데이터로드: DB에서 역대 당첨 데이터 동적 조회 ---
  const loadLottoDraws = useCallback(async () => {
    if (isLocalMode) {
      setDraws(mockLottoDraws);
      return;
    }
    setIsFetchingDraws(true);
    try {
      const { data, error } = await supabase
        .from("draws")
        .select("*")
        .order("drw_no", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: LottoDraw[] = data.map((d) => ({
          drwNo: Number(d.drw_no),
          drwNoDate: d.drw_no_date,
          no1: d.no1,
          no2: d.no2,
          no3: d.no3,
          no4: d.no4,
          no5: d.no5,
          no6: d.no6,
          bonusNo: d.bonus_no,
          totSellAmnt: d.tot_sell_amnt ? Number(d.tot_sell_amnt) : undefined,
          firstWinAmnt: d.first_win_amnt ? Number(d.first_win_amnt) : undefined,
          firstPrzWnerCo: d.first_prz_wner_co ? Number(d.first_prz_wner_co) : undefined,
        }));
        setDraws(mapped);
        setIsUsingMockData(false);
      } else {
        setDraws(mockLottoDraws);
        setIsUsingMockData(true);
        if (!crawlAttempted.current) {
          crawlAttempted.current = true;
          fetch("/api/crawl")
            .then(() => loadLottoDraws())
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to load draws from DB, falling back to mock:", err);
      setDraws(mockLottoDraws);
      setIsUsingMockData(true);
    } finally {
      setIsFetchingDraws(false);
    }
  }, [isLocalMode]);

  // OTP 만료 카운트다운
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  // OTP 재발송 쿨다운
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const resetAuthModal = () => {
    setShowAuthModal(false);
    setAuthError("");
    setAuthSuccessMsg("");
    setAuthStep("form");
    setOtpCode("");
    setOtpCountdown(0);
    setOtpResendCooldown(0);
  };

  // 초기 로드
  useEffect(() => {
    loadSavedNumbers();
    loadLottoDraws();
  }, [loadSavedNumbers, loadLottoDraws, user]);


  // --- 인증 관련 모달 액션 ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    setAuthPending(true);

    try {
      if (isSignUpMode) {
        const res = await signUp(authEmail, authPassword);
        if (res.success) {
          if (isLocalMode) {
            setAuthSuccessMsg("로컬 계정 생성이 완료되어 자동 로그인되었습니다.");
            setTimeout(() => {
              resetAuthModal();
              setAuthEmail("");
              setAuthPassword("");
            }, 1500);
          } else if (res.requiresOtp) {
            setAuthStep("otp");
            setOtpCountdown(600);
            setOtpResendCooldown(60);
          }
        } else {
          setAuthError(res.error || "회원가입에 실패했습니다.");
        }
      } else {
        const res = await login(authEmail, authPassword);
        if (res.success) {
          setAuthSuccessMsg("성공적으로 로그인되었습니다.");
          setTimeout(() => {
            resetAuthModal();
            setAuthEmail("");
            setAuthPassword("");
            if (pendingTab) {
              setActiveTab(pendingTab);
              setPendingTab(null);
            }
          }, 1000);
        } else {
          setAuthError(res.error || "이메일 또는 비밀번호가 잘못되었습니다.");
        }
      }
    } catch {
      setAuthError("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setAuthPending(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otpCode.length !== 6) {
      setAuthError("6자리 인증 코드를 입력해 주세요.");
      return;
    }
    setAuthPending(true);
    setAuthError("");
    try {
      const res = await verifyOtp(authEmail, otpCode);
      if (res.success) {
        setAuthSuccessMsg("이메일 인증이 완료되었습니다!");
        setTimeout(() => {
          resetAuthModal();
          setAuthEmail("");
          setAuthPassword("");
        }, 1200);
      } else {
        setAuthError(res.error || "인증 코드가 올바르지 않습니다.");
      }
    } catch {
      setAuthError("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setAuthPending(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setAuthPending(true);
    setAuthError("");
    try {
      const res = await resendOtp(authEmail);
      if (res.success) {
        setOtpCountdown(600);
        setOtpResendCooldown(60);
        setAuthSuccessMsg("인증 코드를 재발송했습니다.");
        setTimeout(() => setAuthSuccessMsg(""), 3000);
      } else {
        setAuthError(res.error || "재발송에 실패했습니다.");
      }
    } catch {
      setAuthError("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setAuthPending(false);
    }
  };

  // --- 번호 생성 기능 ---
  const handleGenerate = () => {
    const fixed = getFixedNumbers();
    const excluded = getExcludedNumbers();

    let sumRange = null;
    if (sumPreset === "recommended") {
      sumRange = { min: 100, max: 150 };
    } else if (sumPreset === "custom") {
      sumRange = { min: customMinSum, max: customMaxSum };
    }

    let endingSumRange = null;
    if (endingSumPreset === "recommended") {
      endingSumRange = { min: 15, max: 35 };
    } else if (endingSumPreset === "custom") {
      endingSumRange = { min: customMinEndingSum, max: customMaxEndingSum };
    }

    const filters: LottoFilters = {
      fixedNumbers: fixed,
      excludedNumbers: excluded,
      oddEvenRatio,
      sumRange,
      consecutiveLimit,
      endingSumRange,
    };

    const sets = generateLottoNumbers(generateCount, filters);
    setGeneratedSets(sets);
    setJustSavedIndex(null);
  };

  // --- 번호 저장 기능 ---
  const handleSaveNumber = async (numbers: number[], index?: number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const sortedNew = [...numbers].sort((a, b) => a - b).join(",");
    const isDuplicate = savedNumbers.some(
      (s) => [...s.numbers].sort((a, b) => a - b).join(",") === sortedNew
    );
    if (isDuplicate) {
      toast("이미 보관된 번호 조합입니다.", { duration: 2000 });
      return;
    }

    if (isLocalMode) {
      const stored = localStorage.getItem("lottolab_saved");
      const currentList: SavedNumber[] = stored ? JSON.parse(stored) : [];
      const newNum: SavedNumber = {
        id: Math.random().toString(36).substring(2, 9),
        numbers,
        createdAt: new Date().toISOString(),
      };
      const updated = [newNum, ...currentList];
      localStorage.setItem("lottolab_saved", JSON.stringify(updated));
      setSavedNumbers(updated);
      if (index !== undefined) {
        setJustSavedIndex(index);
        setTimeout(() => setJustSavedIndex(null), 2000);
      }
    } else {
      try {
        const { error } = await supabase.from("saved_numbers").insert({
          user_id: user.id,
          numbers,
          memo: "",
        });

        if (error) throw error;

        await loadSavedNumbers();
        if (index !== undefined) {
          setJustSavedIndex(index);
          setTimeout(() => setJustSavedIndex(null), 2000);
        }
      } catch (err) {
        console.error("Failed to save number to Supabase:", err);
        toast.error("번호를 데이터베이스에 저장하지 못했습니다.");
      }
    }
  };

  // --- 보관함 삭제 기능 ---
  const handleDeleteNumber = async (id: string) => {
    if (isLocalMode) {
      const updated = savedNumbers.filter((n) => n.id !== id);
      localStorage.setItem("lottolab_saved", JSON.stringify(updated));
      setSavedNumbers(updated);
    } else {
      try {
        const { error } = await supabase.from("saved_numbers").delete().eq("id", id);
        if (error) throw error;
        await loadSavedNumbers();
      } catch (err) {
        console.error("Failed to delete number:", err);
        toast.error("번호 삭제에 실패했습니다.");
      }
    }
  };

  // --- 보관함 메모 업데이트 기능 ---
  const handleUpdateMemo = async (id: string) => {
    if (isLocalMode) {
      const updated = savedNumbers.map((n) => {
        if (n.id === id) {
          return { ...n, memo: memoText };
        }
        return n;
      });
      localStorage.setItem("lottolab_saved", JSON.stringify(updated));
      setSavedNumbers(updated);
      setEditingMemoId(null);
    } else {
      try {
        const { error } = await supabase
          .from("saved_numbers")
          .update({ memo: memoText })
          .eq("id", id);

        if (error) throw error;
        await loadSavedNumbers();
        setEditingMemoId(null);
      } catch (err) {
        console.error("Failed to update memo:", err);
        toast.error("메모 저장에 실패했습니다.");
      }
    }
  };

  // --- 번호판 그리드 토글 핸들러 ---
  const handleGridClick = (num: number) => {
    const currentMode = gridModes[num] || "none";
    let nextMode: "fixed" | "excluded" | "none" = "none";

    if (currentMode === "none") {
      const fixedCount = getFixedNumbers().length;
      if (fixedCount >= 5) {
        nextMode = "excluded";
      } else {
        nextMode = "fixed";
      }
    } else if (currentMode === "fixed") {
      nextMode = "excluded";
    } else if (currentMode === "excluded") {
      nextMode = "none";
    }

    setGridModes((prev) => ({
      ...prev,
      [num]: nextMode,
    }));
  };

  const handleResetGrid = () => {
    setGridModes({});
    setOddEvenRatio("all");
    setSumPreset("recommended");
    setConsecutiveLimit(0);
    setEndingSumPreset("all");
    setGeneratedSets([]);
  };

  const handleOpenReport = (set: number[]) => {
    setReportTargetSet(set);
    const report = checkHistoricalPerformance(set, draws);
    setPerformanceReport(report);
  };

  // --- 시뮬레이터 실행 ---
  const runSimulation = () => {
    if (!selectedSimSet) return;
    setIsSimulating(true);

    setTimeout(() => {
      const matches = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, none: 0 };
      let totalWon = 0;
      let totalSpent = 0;

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
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const winning: number[] = [];
        for (let j = 0; j < 6; j++) {
          const idx = Math.floor(Math.random() * pool.length);
          winning.push(pool.splice(idx, 1)[0]);
        }
        const bonus = pool[Math.floor(Math.random() * pool.length)];
        return { winning: winning.sort((a, b) => a - b), bonus };
      };

      if (simMode === "historical") {
        const actualDrawCount = draws.length;
        for (let i = 0; i < actualDrawCount; i++) {
          const d = draws[i];
          countMatch([d.no1, d.no2, d.no3, d.no4, d.no5, d.no6], d.bonusNo);
        }
        totalSpent = actualDrawCount * 1000;
      } else {
        const gameCount = Math.floor(simBudget / 1000);
        for (let i = 0; i < gameCount; i++) {
          const { winning, bonus } = randomDraw();
          countMatch(winning, bonus);
        }
        totalSpent = simBudget;
      }

      const roi = totalSpent > 0 ? (totalWon / totalSpent) * 100 : 0;

      setSimResults({ ran: true, totalSpent, totalWon, roi, matches });
      setIsSimulating(false);
    }, 800);
  };

  // --- 꿈 해몽 AI ---
  const loadDreamHistory = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setDreamHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("dream_logs")
        .select("id, dream_text, interpretation, keywords, numbers, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!error && data) {
        setDreamHistory(data as typeof dreamHistory);
      }
    } catch {
      // 조용히 실패
    } finally {
      setDreamHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dream" && user?.id) {
      loadDreamHistory(user.id);
    }
  }, [activeTab, user, loadDreamHistory]);

  const handleDreamInterpret = async () => {
    if (!dreamInput.trim()) return;
    setDreamLoading(true);
    setDreamSaveSuccess(false);
    setDreamResult(null);

    try {
      const res = await fetch("/api/dream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText: dreamInput, userId: user?.id }),
      });

      if (!res.ok) throw new Error("Dream API invocation failed");

      const data = await res.json();
      setDreamResult(data);
      if (user?.id) loadDreamHistory(user.id);
    } catch (err) {
      console.error(err);
      toast.error("꿈 해몽 처리 중 오류가 발생했습니다.");
    } finally {
      setDreamLoading(false);
    }
  };

  const handleSaveDreamNumbers = async () => {
    if (!dreamResult) return;
    await handleSaveNumber(dreamResult.numbers);
    setDreamSaveSuccess(true);
    setTimeout(() => setDreamSaveSuccess(false), 3000);
  };

  // --- 복사 핸들러 ---
  const handleCopyToClipboard = (nums: number[]) => {
    const text = nums.join(", ");
    navigator.clipboard.writeText(text);
    toast.success(`번호 [${text}] 복사됨`, { duration: 2000 });
  };

  // --- 통계 가공 변수 ---
  const statsData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) counts[i] = 0;

    let totalOdd = 0;
    let totalEven = 0;

    draws.forEach((d) => {
      const nums = [d.no1, d.no2, d.no3, d.no4, d.no5, d.no6];
      nums.forEach((n) => {
        counts[n] = (counts[n] || 0) + 1;
        if (n % 2 === 0) totalEven++;
        else totalOdd++;
      });
    });

    const frequencyList = Object.entries(counts).map(([num, count]) => ({
      num: parseInt(num, 10),
      count,
    }));

    const sortedByFreqDesc = [...frequencyList].sort((a, b) => b.count - a.count);
    const sortedByFreqAsc = [...frequencyList].sort((a, b) => a.count - b.count);

    return {
      topNumbers: sortedByFreqDesc.slice(0, 10),
      bottomNumbers: sortedByFreqAsc.slice(0, 10),
      oddPct: Math.round((totalOdd / (totalOdd + totalEven || 1)) * 100),
      evenPct: Math.round((totalEven / (totalOdd + totalEven || 1)) * 100),
      allFrequency: frequencyList,
    };
  }, [draws]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 16V12" />
                <path d="M12 16V8" />
                <path d="M16 16V10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  LottoLab
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400 font-semibold uppercase">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">데이터 기반 분석 & AI 로또 추천소</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "generator"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              번호 생성
            </button>
            <button
              onClick={() => setActiveTab("locker")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "locker"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              보관함
              {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
              {user && savedNumbers.length > 0 && (
                <span className="text-[9px] px-1 rounded-full bg-slate-800 text-slate-300 font-bold">
                  {savedNumbers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              당첨 통계
              {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "simulator"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              모의 투자
              {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
            </button>
            <button
              onClick={() => {
                setActiveTab("dream");
                setDreamResult(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "dream"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              꿈 해몽 AI
              {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
            </button>
          </nav>

          {/* User Auth Info */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <span className="text-xs text-slate-500">인증 복구 중...</span>
            ) : user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[100px] truncate">{user.email.split("@")[0]}</span>
                </div>
                <button
                  onClick={logout}
                  title="로그아웃"
                  className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError("");
                  setAuthSuccessMsg("");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-950/80 border border-blue-900/60 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                로그인 / 가입
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. Main Dashboard Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">

        {/* Local Mode Warning Banner */}
        {isLocalMode && (
          <div className="mb-6 p-3 bg-amber-950/40 border border-amber-900/40 rounded-lg text-xs text-amber-200 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">환경 변수가 구성되지 않아 로컬 브라우저 저장 모드로 동작 중입니다.</span>
              프로젝트 폴더의 `.env.local` 파일에 Supabase와 Gemini API 설정을 제공하시면 데이터베이스 서버 저장 및 실제 AI 꿈 해몽 기능이 자동으로 활성화됩니다. 현재는 모의 기능으로 모든 테스트가 가능합니다.
            </div>
          </div>
        )}

        {/* --- TAB: 번호 생성기 (Generator) --- */}
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

        {/* --- TAB: 보관함 (Locker) --- */}
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

        {/* --- TAB: 당첨 통계 (Statistics) --- */}
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

        {/* --- TAB: 모의 투자 (Simulator) --- */}
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

        {/* --- TAB: 꿈 해몽 AI (Dream) --- */}
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

      {/* 3. Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-400">LottoLab</span>
            <span className="text-[10px] text-slate-600">|</span>
            <span>All rights reserved &copy; 2026</span>
          </div>
          <p className="max-w-md text-slate-600 text-left sm:text-right text-[11px] leading-4">
            로또복권은 1인당 10만원 한도 내에서 건전하게 즐기는 대중적인 게임입니다. 당첨 조합 예측은 학술적이고 통계적인 연구 목적이며, 실제 당첨 여부는 완전한 독립적 확률에 의존합니다.
          </p>
        </div>
      </footer>

      {/* 4. Auth Modal */}
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

      {/* 5. Report Card Modal */}
      {reportTargetSet && performanceReport && (
        <ReportModal
          reportTargetSet={reportTargetSet}
          performanceReport={performanceReport}
          onClose={() => {
            setReportTargetSet(null);
            setPerformanceReport(null);
          }}
        />
      )}

    </div>
  );
}
