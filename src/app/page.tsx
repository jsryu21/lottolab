"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  generateLottoNumbers,
  LottoFilters,
  SavedNumber,
  LottoDraw,
  mockLottoDraws,
  calculateOddEven,
  calculateSum,
  checkHistoricalPerformance,
  PerformanceReport,
  getMaxConsecutiveCount,
  calculateEndingSum,
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
  Copy,
  Trash2,
  Bookmark,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Info,
  Calendar,
  DollarSign,
  TrendingDown,
  User,
  Sliders,
  ShieldAlert,
  CreditCard,
  QrCode,
  Award,
  Lock,
} from "lucide-react";
import LoginGateCard from "@/components/LoginGateCard";

const GATED_TABS = ["locker", "stats", "simulator", "dream"] as const;

export default function LottoLabDashboard() {
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
  const [consecutiveLimit, setConsecutiveLimit] = useState<number>(0); // 0: 제한없음
  const [endingSumPreset, setEndingSumPreset] = useState<"all" | "recommended" | "custom">("all");
  const [customMinEndingSum, setCustomMinEndingSum] = useState<number>(15);
  const [customMaxEndingSum, setCustomMaxEndingSum] = useState<number>(35);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // 1.5 PRO 멤버십 및 수익화 관련 상태
  const [isProMember, setIsProMember] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentPending, setPaymentPending] = useState<boolean>(false);

  // 1.6 성적표 모달 관련 상태
  const [reportTargetSet, setReportTargetSet] = useState<number[] | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);

  // 2. 보관함 상태
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [lockerLoading, setLockerLoading] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  // 3. 통계 및 역사 데이터 상태
  const [draws, setDraws] = useState<LottoDraw[]>(mockLottoDraws);
  const [isFetchingDraws, setIsFetchingDraws] = useState(false);

  // 4. 시뮬레이터 상태
  const [selectedSimSet, setSelectedSimSet] = useState<number[] | null>(null);
  const [simBudget, setSimBudget] = useState<number>(100000); // 10만원 디폴트
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
      // 로컬 모드: localStorage 조회
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
      // 온라인 모드: Supabase DB 조회
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
      } else {
        // DB에 데이터가 없으면 크롤링 호출을 유도하기 위해 Mock 사용
        setDraws(mockLottoDraws);
      }
    } catch (err) {
      console.error("Failed to load draws from DB, falling back to mock:", err);
      setDraws(mockLottoDraws);
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
    const savedPro = localStorage.getItem("lottolab_pro") === "true";
    setIsProMember(savedPro);
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

    // 중복 저장 방지
    const sortedNew = [...numbers].sort((a, b) => a - b).join(",");
    const isDuplicate = savedNumbers.some(
      (s) => [...s.numbers].sort((a, b) => a - b).join(",") === sortedNew
    );
    if (isDuplicate) {
      toast("이미 보관된 번호 조합입니다.", { duration: 2000 });
      return;
    }

    if (isLocalMode) {
      // 로컬 저장소 저장
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
      // Supabase DB 저장
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
      // 고정수로 설정 (단, 고정수는 최대 5개)
      const fixedCount = getFixedNumbers().length;
      if (fixedCount >= 5) {
        nextMode = "excluded"; // 고정수가 가득 찼으면 바로 제외수로 설정
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

  // 번호판 전체 초기화
  const handleResetGrid = () => {
    setGridModes({});
    setOddEvenRatio("all");
    setSumPreset("recommended");
    setConsecutiveLimit(0);
    setEndingSumPreset("all");
    setGeneratedSets([]);
  };

  // 성적표 분석 실행
  const handleOpenReport = (set: number[]) => {
    setReportTargetSet(set);
    const report = checkHistoricalPerformance(set, draws);
    setPerformanceReport(report);
  };
  // 멤버십 결제 시뮬레이션
  const handleInitiatePayment = () => {
    if (isLocalMode) {
      setPaymentPending(true);
      setTimeout(() => {
        setPaymentPending(false);
        setIsProMember(true);
        localStorage.setItem("lottolab_pro", "true");
        toast.success("로컬 모드 테스트 결제(990원) 완료! PRO 멤버십이 활성화되었습니다.");
        setShowPaymentModal(false);
      }, 1500);
    } else {
      if (typeof window === "undefined" || !(window as any).IMP) {
        // SDK 미로드 시 즉시 테스트 연동
        setPaymentPending(true);
        setTimeout(() => {
          setPaymentPending(false);
          setIsProMember(true);
          localStorage.setItem("lottolab_pro", "true");
          toast.success("포트원 테스트 연동 완료! PRO 멤버십이 연동되었습니다.");
          setShowPaymentModal(false);
        }, 1200);
        return;
      }
      
      const { IMP } = window as any;
      IMP.init("imp36712356"); // 가맹점 식별코드
      
      IMP.request_pay({
        pg: "kakaopay.TC00000000",
        pay_method: "card",
        merchant_uid: `merchant_${new Date().getTime()}`,
        name: "LottoLab PRO 멤버십 (1개월)",
        amount: 990,
        buyer_email: user?.email || "test@lottolab.com",
        buyer_name: "로또랩후원자",
      }, function (rsp: any) {
        if (rsp.success) {
          setIsProMember(true);
          localStorage.setItem("lottolab_pro", "true");
          toast.success("결제 후원이 완료되었습니다! 감사합니다. PRO 멤버십이 활성화되었습니다.");
          setShowPaymentModal(false);
        } else {
          toast.error(`결제에 실패하였습니다: ${rsp.error_msg}`);
        }
      });
    }
  };

  const handleCancelMembership = () => {
    setIsProMember(false);
    localStorage.removeItem("lottolab_pro");
    toast("PRO 멤버십 후원이 해제되었습니다. 일반 등급으로 전환됩니다.");
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
        // 방법 A: 역대 전체 회차 대조 — scaleFactor 없이 실제 대조 결과를 그대로 사용
        const actualDrawCount = draws.length;
        for (let i = 0; i < actualDrawCount; i++) {
          const d = draws[i];
          countMatch([d.no1, d.no2, d.no3, d.no4, d.no5, d.no6], d.bonusNo);
        }
        totalSpent = actualDrawCount * 1000;
      } else {
        // 방법 B: 몬테카를로 — 예산 게임 수만큼 독립 무작위 추첨
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
        body: JSON.stringify({ dreamText: dreamInput }),
      });

      if (!res.ok) throw new Error("Dream API invocation failed");

      const data = await res.json();
      setDreamResult(data);
    } catch (err) {
      console.error(err);
      toast.error("꿈 해몽 처리 중 오류가 발생했습니다.");
    } finally {
      setDreamLoading(false);
    }
  };

  // 꿈 해몽 번호 바로 보관함 저장
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

  // 번호 테두리 색상 분류 헬퍼
  const getBallColor = (num: number) => {
    if (num >= 1 && num <= 10) return "bg-amber-400 text-amber-950 border-amber-500 shadow-amber-500/20";
    if (num >= 11 && num <= 20) return "bg-blue-500 text-white border-blue-600 shadow-blue-500/20";
    if (num >= 21 && num <= 30) return "bg-rose-500 text-white border-rose-600 shadow-rose-500/20";
    if (num >= 31 && num <= 40) return "bg-slate-500 text-white border-slate-600 shadow-slate-500/20";
    return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Script src="https://cdn.iamport.kr/v1/iamport.js" strategy="lazyOnload" />
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
            {isProMember ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-bold border border-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform"
              >
                <Award className="w-3.5 h-3.5" /> PRO 회원
              </button>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 transition-all"
              >
                <DollarSign className="w-3 h-3" /> 후원 (990원)
              </button>
            )}

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Filter Panel */}
            <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6 relative">

              {/* 비로그인 잠금 오버레이 */}
              {!user && (
                <div className="absolute inset-0 bg-slate-950/75 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-[2px] gap-3">
                  <Lock className="w-7 h-7 text-slate-400" />
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-slate-200 mb-1">필터 기능은 로그인 후 이용 가능합니다</p>
                    <p className="text-[11px] text-slate-400">아래 버튼으로 필터 없이 랜덤 추출은 바로 가능합니다.</p>
                  </div>
                  <button
                    onClick={() => { setPendingTab(null); setShowAuthModal(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    로그인 / 무료 회원가입
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Dices className="w-5 h-5 text-blue-400" />
                  <h2 className="font-bold text-base">필터 설정</h2>
                </div>
                <button
                  onClick={handleResetGrid}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  필터 초기화
                </button>
              </div>

              {/* 1. 번호 선택 그리드 (고정수/제외수 일체형 그리드) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
                  <span>번호 직접 선택 (고정/제외 지정)</span>
                  <span className="text-[10px] text-slate-500 font-normal">고정수는 최대 5개까지 선택 가능</span>
                </label>
                
                {/* 설명 안내 */}
                <div className="mb-3 grid grid-cols-3 text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 고정수 (1회 클릭)
                  </div>
                  <div className="flex items-center justify-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> 제외수 (2회 클릭)
                  </div>
                  <div className="flex items-center justify-center gap-1 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" /> 해제 (3회 클릭)
                  </div>
                </div>

                <div className="grid grid-cols-9 gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                    const mode = gridModes[num] || "none";
                    let btnStyle = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700";
                    if (mode === "fixed") {
                      btnStyle = "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20";
                    } else if (mode === "excluded") {
                      btnStyle = "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-500/20";
                    }
                    return (
                      <button
                        key={num}
                        onClick={() => handleGridClick(num)}
                        className={`w-full aspect-square text-[11px] font-bold rounded-md border flex items-center justify-center transition-all ${btnStyle}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* 현재 선택 요약 */}
                <div className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-slate-400 shrink-0">고정수:</span>
                    <span className="font-bold text-blue-400">
                      {getFixedNumbers().length > 0 ? getFixedNumbers().join(", ") : "없음"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 shrink-0">제외수:</span>
                    <span className="font-bold text-rose-400">
                      {getExcludedNumbers().length > 0 ? getExcludedNumbers().join(", ") : "없음"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 홀짝 비율 필터 */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">홀짝 비율 지정</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "전체", value: "all" },
                    { label: "홀3 : 짝3", value: "3:3" },
                    { label: "홀2 : 짝4", value: "2:4" },
                    { label: "홀4 : 짝2", value: "4:2" },
                    { label: "홀1 : 짝5", value: "1:5" },
                    { label: "홀5 : 짝1", value: "5:1" },
                    { label: "홀0 : 짝6", value: "0:6" },
                    { label: "홀6 : 짝0", value: "6:0" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setOddEvenRatio(item.value)}
                      className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                        oddEvenRatio === item.value
                          ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 합계 범위 필터 */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">총합계 범위 필터</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSumPreset("all")}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                      sumPreset === "all"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    제한 없음
                  </button>
                  <button
                    onClick={() => setSumPreset("recommended")}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                      sumPreset === "recommended"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    100 ~ 150 (권장)
                  </button>
                  <button
                    onClick={() => setSumPreset("custom")}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold border ${
                      sumPreset === "custom"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    직접 입력
                  </button>
                </div>

                {sumPreset === "custom" && (
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <input
                      type="number"
                      value={customMinSum}
                      onChange={(e) => setCustomMinSum(Number(e.target.value))}
                      className="w-full bg-slate-900 text-center rounded border border-slate-800 py-1 text-xs text-white"
                      placeholder="최소"
                    />
                    <span className="text-slate-500 text-xs">~</span>
                    <input
                      type="number"
                      value={customMaxSum}
                      onChange={(e) => setCustomMaxSum(Number(e.target.value))}
                      className="w-full bg-slate-900 text-center rounded border border-slate-800 py-1 text-xs text-white"
                      placeholder="최대"
                    />
                  </div>
                )}
              </div>

              {/* 4. 추출 개수 선택 */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">추천 조합 개수</label>
                <div className="flex gap-2">
                  {[1, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setGenerateCount(num)}
                      className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                        generateCount === num
                          ? "bg-blue-600/20 border-blue-500 text-blue-400"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      {num}개 {num === 5 && "(추천)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. 고급 설정 토글 */}
              <div className="border-t border-slate-800/80 pt-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    고급 분석 설정
                  </span>
                  <span className="text-[10px] text-blue-400">
                    {showAdvancedFilters ? "닫기 ▲" : "열기 ▼"}
                  </span>
                </button>

                {showAdvancedFilters && (
                  <div className="mt-4 space-y-4 pt-2">
                    {/* 연속 번호 제한 */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex justify-between">
                        <span>연속 번호 제한 (연속 수 차단)</span>
                        <span className="text-[9px] text-slate-500 font-normal">정밀 조합 필터</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: "제한 없음", value: 0 },
                          { label: "2연속 차단", value: 2 },
                          { label: "3연속 차단", value: 3 },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setConsecutiveLimit(opt.value)}
                            className={`py-1 rounded text-[10px] font-bold border transition-all ${
                              consecutiveLimit === opt.value
                                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 끝수 합 필터 */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        끝수 합 필터 (일의 자리 합계 제어)
                      </label>
                      <div className="flex gap-1.5 mb-2">
                        <button
                          onClick={() => setEndingSumPreset("all")}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                            endingSumPreset === "all"
                              ? "bg-blue-600/20 border-blue-500 text-blue-400"
                              : "bg-slate-950 border-slate-800 text-slate-500"
                          }`}
                        >
                          제한 없음
                        </button>
                        <button
                          onClick={() => setEndingSumPreset("recommended")}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                            endingSumPreset === "recommended"
                              ? "bg-blue-600/20 border-blue-500 text-blue-400"
                              : "bg-slate-950 border-slate-800 text-slate-500"
                          }`}
                        >
                          15 ~ 35 (추천)
                        </button>
                        <button
                          onClick={() => setEndingSumPreset("custom")}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                            endingSumPreset === "custom"
                              ? "bg-blue-600/20 border-blue-500 text-blue-400"
                              : "bg-slate-950 border-slate-800 text-slate-500"
                          }`}
                        >
                          직접 입력
                        </button>
                      </div>

                      {endingSumPreset === "custom" && (
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                          <input
                            type="number"
                            value={customMinEndingSum}
                            onChange={(e) => setCustomMinEndingSum(Number(e.target.value))}
                            className="w-full bg-slate-900 text-center rounded border border-slate-800 py-0.5 text-xs text-white"
                            placeholder="최소"
                          />
                          <span className="text-slate-500 text-xs">~</span>
                          <input
                            type="number"
                            value={customMaxEndingSum}
                            onChange={(e) => setCustomMaxEndingSum(Number(e.target.value))}
                            className="w-full bg-slate-900 text-center rounded border border-slate-800 py-0.5 text-xs text-white"
                            placeholder="최대"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Display Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-blue-950/60 border border-blue-900/50 rounded-full mb-3 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-bold text-base mb-1">행운의 번호 준비 완료</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-5">
                  지정하신 조건 필터를 충족하는 6/45 최적화 조합을 생성합니다.
                </p>
                <button
                  onClick={handleGenerate}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] w-full sm:w-auto"
                >
                  <Dices className="w-4 h-4" />
                  로또 번호 추천받기
                </button>
              </div>

              {/* 생성된 세트 결과 */}
              {generatedSets.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-slate-400">추천 생성 결과</span>
                    <span className="text-[10px] text-slate-500">각 행 우측의 아이콘으로 저장/복사 가능</span>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {generatedSets.map((set, idx) => {
                      const { odd, even } = calculateOddEven(set);
                      const sum = calculateSum(set);
                      const isSaved = justSavedIndex === idx;

                      return (
                        <React.Fragment key={idx}>
                          <div className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            {/* 번호 볼 리스트 */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 w-5">#{idx + 1}</span>
                              <div className="flex items-center gap-1.5">
                                {set.map((num) => (
                                  <span
                                    key={num}
                                    className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-inner ${getBallColor(
                                      num
                                    )}`}
                                  >
                                    {num}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 상세 스펙 및 액션 */}
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="flex gap-2 text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                                  합계: {sum}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                                  홀짝: {odd}:{even}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyToClipboard(set)}
                                  title="복사"
                                  className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!user) { setShowAuthModal(true); return; }
                                    handleOpenReport(set);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded border bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
                                >
                                  {!user && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                                  성적표
                                </button>
                                <button
                                  onClick={() => handleSaveNumber(set, idx)}
                                  disabled={isSaved}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded border transition-all ${
                                    isSaved
                                      ? "bg-emerald-950 border-emerald-900 text-emerald-400"
                                      : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                                  }`}
                                >
                                  {isSaved ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                                      저장됨
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-3 h-3" />
                                      보관
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 네이티브 하이브리드 광고 지면 (PRO 멤버가 아닐 때 2번째 또는 3번째 세트 뒤 노출) */}
                          {!isProMember && (idx + 1) % 3 === 0 && (
                            <div className="my-3 py-3 px-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded font-semibold tracking-wider uppercase scale-90">Sponsor</span>
                                <p className="text-slate-400 text-[11px]">로또랩을 후원하고 모든 배너 광고를 차단하세요! (월 990원)</p>
                              </div>
                              <button
                                onClick={() => setShowPaymentModal(true)}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline shrink-0"
                              >
                                PRO 가입
                              </button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* --- TAB: 보관함 (Locker) --- */}
        {activeTab === "locker" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base">내 번호 보관함</h2>
              </div>
              <span className="text-xs text-slate-400">
                총 {savedNumbers.length}개 보관 중
              </span>
            </div>

            {!user ? (
              <LoginGateCard tab="locker" onLogin={() => { setPendingTab("locker"); setShowAuthModal(true); }} />
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
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-3 shadow-inner hover:border-slate-700/80 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        {/* 볼 표시 */}
                        <div className="flex items-center gap-1.5">
                          {item.numbers.map((n) => (
                            <span
                              key={n}
                              className={`w-7 h-7 rounded-full border text-[11px] font-extrabold flex items-center justify-center shadow-inner ${getBallColor(
                                n
                              )}`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                        
                        {/* 액션 버튼 */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyToClipboard(item.numbers)}
                            title="복사"
                            className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteNumber(item.id)}
                            title="삭제"
                            className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 보조 상세 스펙 */}
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 bg-slate-900/40 p-1.5 rounded border border-slate-900/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {dateFormatted}
                        </span>
                        <span>합계: {sum}</span>
                        <span>홀짝: {odd}:{even}</span>
                      </div>

                      {/* 메모 관리 */}
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
                            <button
                              onClick={() => handleUpdateMemo(item.id)}
                              className="px-2.5 py-1 bg-blue-600 rounded text-[10px] font-bold text-white shrink-0"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingMemoId(null)}
                              className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300 shrink-0"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                            <span className="truncate italic text-slate-400">
                              {item.memo || "메모 기록이 없습니다."}
                            </span>
                            <button
                              onClick={() => {
                                setEditingMemoId(item.id);
                                setMemoText(item.memo || "");
                              }}
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
        )}

        {/* --- TAB: 당첨 통계 (Statistics) --- */}
        {activeTab === "stats" && (
          !user ? (
            <LoginGateCard tab="stats" onLogin={() => { setPendingTab("stats"); setShowAuthModal(true); }} />
          ) : <div className="space-y-6">

            {/* 최근 당첨 회차 목록 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 왼쪽 최근 1회차 헤드라인 */}
              <div className="lg:col-span-1 bg-gradient-to-b from-blue-950/40 to-slate-900/50 border border-blue-900/20 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-md">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-900/60 inline-block mb-2 uppercase">
                    LATEST DRAW
                  </span>
                  <h3 className="font-extrabold text-xl mb-1 text-slate-100">
                    제 {draws[0]?.drwNo || "0000"}회 당첨 결과
                  </h3>
                  <p className="text-xs text-slate-400">추첨일: {draws[0]?.drwNoDate || "2000-01-01"}</p>
                </div>

                <div className="flex items-center gap-1.5 my-3">
                  {[draws[0]?.no1, draws[0]?.no2, draws[0]?.no3, draws[0]?.no4, draws[0]?.no5, draws[0]?.no6].map((num, idx) => (
                    <span
                      key={idx}
                      className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${
                        num ? getBallColor(num) : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {num}
                    </span>
                  ))}
                  <span className="text-slate-500 text-xs px-0.5">+</span>
                  <span
                    className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${
                      draws[0]?.bonusNo ? getBallColor(draws[0].bonusNo) : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}
                  >
                    {draws[0]?.bonusNo}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span>1등 당첨금 (1인당)</span>
                    <span className="font-bold text-emerald-400">
                      {draws[0]?.firstWinAmnt ? `${(draws[0].firstWinAmnt / 100000000).toFixed(1)}억원` : "집계 전"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>1등 당첨 인원</span>
                    <span className="font-bold text-slate-200">
                      {draws[0]?.firstPrzWnerCo ? `${draws[0].firstPrzWnerCo}명` : "집계 전"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 오른쪽 과거 회차 리스트 */}
              <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400">최근 당첨 회차 이력 (최대 10회)</span>
                  {isFetchingDraws && <span className="text-[10px] text-blue-400 animate-pulse">갱신 중...</span>}
                </div>

                <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-800/60 pr-2">
                  {draws.slice(0, 10).map((draw) => (
                    <div key={draw.drwNo} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-300 w-16">{draw.drwNo}회차</span>
                      <div className="flex items-center gap-1">
                        {[draw.no1, draw.no2, draw.no3, draw.no4, draw.no5, draw.no6].map((num, idx) => (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center ${getBallColor(
                              num
                            )}`}
                          >
                            {num}
                          </span>
                        ))}
                        <span className="text-[9px] text-slate-600 px-0.5">+</span>
                        <span
                          className={`w-6 h-6 rounded-full border text-[9px] font-bold flex items-center justify-center ${getBallColor(
                            draw.bonusNo
                          )}`}
                        >
                          {draw.bonusNo}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">{draw.drwNoDate}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 통계 지표 대시보드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. 최빈 번호 */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
                <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  많이 출현한 번호 (TOP 10)
                </h3>
                <div className="grid grid-cols-5 gap-2.5">
                  {statsData.topNumbers.map((item) => (
                    <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-900">
                      <span className={`w-6 h-6 rounded-full border text-[9px] font-extrabold flex items-center justify-center ${getBallColor(item.num)}`}>
                        {item.num}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{item.count}회</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 최저빈 번호 */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md">
                <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  적게 출현한 번호 (LAST 10)
                </h3>
                <div className="grid grid-cols-5 gap-2.5">
                  {statsData.bottomNumbers.map((item) => (
                    <div key={item.num} className="flex flex-col items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-900">
                      <span className={`w-6 h-6 rounded-full border text-[9px] font-extrabold flex items-center justify-center ${getBallColor(item.num)}`}>
                        {item.num}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{item.count}회</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 홀짝 통계 비율 */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
                <h3 className="font-bold text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  역대 당첨 번호 홀짝 분포
                </h3>

                <div className="space-y-4">
                  {/* 홀수 바 */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                      <span>홀수 (Odd Numbers)</span>
                      <span>{statsData.oddPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${statsData.oddPct}%` }} />
                    </div>
                  </div>

                  {/* 짝수 바 */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                      <span>짝수 (Even Numbers)</span>
                      <span>{statsData.evenPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${statsData.evenPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 mt-4 text-center">
                  * 역대 수집된 당첨 정보 {draws.length}회차의 모든 공 기준 통계
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- TAB: 모의 투자 (Simulator) --- */}
        {activeTab === "simulator" && (
          !user ? (
            <LoginGateCard tab="simulator" onLogin={() => { setPendingTab("simulator"); setShowAuthModal(true); }} />
          ) : <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base">역대 회차 대입 모의 투자</h2>
              </div>
              <span className="text-xs text-slate-400">로또 당첨 현실성을 시뮬레이션으로 점검합니다.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 왼쪽 조작 패널 */}
              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-5">
                
                {/* 1. 번호 선택 */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">시뮬레이션 대입 조합 선택</label>
                  
                  {savedNumbers.length === 0 ? (
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center text-xs text-slate-400">
                      보관함에 저장된 번호가 없습니다. 아래 무작위 조합을 활용하거나 번호를 먼저 보관해 보세요.
                      <button
                        onClick={() => setSelectedSimSet([1, 7, 15, 23, 33, 45])}
                        className="block mx-auto mt-2 text-[10px] text-blue-400 font-bold hover:underline"
                      >
                        [1, 7, 15, 23, 33, 45] 임시 적용
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                      {savedNumbers.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedSimSet(item.numbers);
                            setSimResults(null);
                          }}
                          className={`w-full p-2 rounded border text-left flex items-center justify-between transition-all ${
                            selectedSimSet?.join(",") === item.numbers.join(",")
                              ? "bg-blue-600/10 border-blue-500 text-blue-400"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex gap-1">
                            {item.numbers.map((n) => (
                              <span key={n} className="text-[10px] font-bold px-1 bg-slate-950 rounded text-slate-300">
                                {n}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">{item.memo || "보관 조합"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 선택 확인 */}
                {selectedSimSet && (
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">선택된 타겟 번호</span>
                    <div className="flex justify-center gap-1.5">
                      {selectedSimSet.map((n) => (
                        <span key={n} className={`w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center ${getBallColor(n)}`}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. 시뮬레이션 모드 선택 */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">시뮬레이션 방식</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setSimMode("historical"); setSimResults(null); }}
                      className={`py-2 px-3 rounded text-[11px] font-bold border transition-all text-left space-y-0.5 ${
                        simMode === "historical"
                          ? "bg-blue-600/15 border-blue-500 text-blue-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div>역대 전체 대조</div>
                      <div className="text-[9px] font-normal text-slate-500">모든 역대 회차에 대입</div>
                    </button>
                    <button
                      onClick={() => { setSimMode("montecarlo"); setSimResults(null); }}
                      className={`py-2 px-3 rounded text-[11px] font-bold border transition-all text-left space-y-0.5 ${
                        simMode === "montecarlo"
                          ? "bg-blue-600/15 border-blue-500 text-blue-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div>몬테카를로</div>
                      <div className="text-[9px] font-normal text-slate-500">예산 게임 수 무작위 추첨</div>
                    </button>
                  </div>
                </div>

                {/* 3. 모의 예산 설정 (몬테카를로 모드에서만 의미있음) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    모의 구매 예산
                    {simMode === "historical" && (
                      <span className="ml-2 text-[9px] font-normal text-slate-600">(역대 대조 모드에서는 미사용)</span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10000, 50000, 100000, 1000000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSimBudget(amount);
                          setSimResults(null);
                        }}
                        className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                          simBudget === amount
                            ? "bg-blue-600/20 border-blue-500 text-blue-400"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 text-right">
                    * 1게임 = 1,000원 적용 (총 {simBudget / 1000}게임)
                  </div>
                </div>

                {/* 3. 실행 버튼 */}
                <button
                  disabled={!selectedSimSet || isSimulating}
                  onClick={runSimulation}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      대입 분석 시뮬레이션 중...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      모의 구매 시뮬레이션 시작
                    </>
                  )}
                </button>

              </div>

              {/* 오른쪽 결과 패널 */}
              <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between gap-4min-h-[350px]">
                
                {!simResults ? (
                  <div className="flex flex-col items-center justify-center text-center h-full py-16 space-y-2 text-slate-500">
                    <Info className="w-10 h-10 text-slate-600 mb-1" />
                    <h3 className="font-bold text-sm">결과 대기 중</h3>
                    <p className="text-xs max-w-xs">
                      좌측에서 시뮬레이션할 번호와 예산을 설정하고 구매 버튼을 클릭하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* 상단 재무 요약 */}
                    <div className="grid grid-cols-3 gap-3">
                      
                      <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {simMode === "historical" ? "총 대조 횟수" : "총 투자액"}
                        </span>
                        <span className="text-sm font-bold text-slate-200">
                          {simMode === "historical"
                            ? `${(simResults.totalSpent / 1000).toLocaleString()}회`
                            : `${simResults.totalSpent.toLocaleString()}원`}
                        </span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">총 당첨금</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {simResults.totalWon.toLocaleString()}원
                        </span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded border border-slate-800/80 text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">수익률 (ROI)</span>
                        <span className={`text-sm font-bold flex items-center justify-center gap-0.5 ${simResults.roi >= 100 ? "text-emerald-400" : "text-rose-500"}`}>
                          {simResults.roi.toFixed(2)}%
                          {simResults.roi < 100 && <TrendingDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>

                    </div>

                    {/* 등수 매칭 결과 테이블 */}
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-2.5">등수별 당첨 횟수</span>
                      <div className="space-y-2 text-xs">
                        
                        {[
                          { place: "1등 (6개 일치)", count: simResults.matches.first, prize: "가상 20억원", color: "text-amber-400" },
                          { place: "2등 (5개 + 보너스)", count: simResults.matches.second, prize: "가상 6천만원", color: "text-blue-400" },
                          { place: "3등 (5개 일치)", count: simResults.matches.third, prize: "가상 150만원", color: "text-slate-300" },
                          { place: "4등 (4개 일치)", count: simResults.matches.fourth, prize: "50,000원", color: "text-slate-400" },
                          { place: "5등 (3개 일치)", count: simResults.matches.fifth, prize: "5,000원", color: "text-slate-500" },
                          { place: "낙첨 (2개 이하)", count: simResults.matches.none, prize: "0원", color: "text-slate-600" },
                        ].map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-900">
                            <span className={`font-bold ${row.color}`}>{row.place}</span>
                            <div className="flex gap-4">
                              <span className="text-slate-400">({row.prize})</span>
                              <span className="font-extrabold text-slate-200">{row.count}회</span>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* 최종 코멘트 */}
                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        {simMode === "historical"
                          ? `역대 ${(simResults.totalSpent / 1000).toLocaleString()}회차 전체에 선택 번호를 대입한 통계 결과입니다. scaleFactor 왜곡 없이 실제 당첨 이력을 그대로 반영합니다.`
                          : "몬테카를로 방식으로 예산 게임 수만큼 독립 무작위 추첨을 시행한 확률론적 결과입니다. 매 실행마다 결과가 달라집니다."}
                        {" "}(로또는 재미로 구매하는 건전한 오락입니다.)
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* --- TAB: 꿈 해몽 AI (Dream) --- */}
        {activeTab === "dream" && (
          !user ? (
            <LoginGateCard tab="dream" onLogin={() => { setPendingTab("dream"); setShowAuthModal(true); }} />
          ) : <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-md space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base">Gemini AI 꿈 해몽 번호 추출</h2>
              </div>
              <span className="text-xs text-slate-400">꿈속 상징을 분석해 로또 추천 번호로 치환합니다.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 왼쪽 서술 폼 */}
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
                  <div className="text-[10px] text-slate-500 text-right mt-1">
                    {dreamInput.length} / 300자
                  </div>
                </div>

                <button
                  disabled={!dreamInput.trim() || dreamLoading}
                  onClick={handleDreamInterpret}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)]"
                >
                  {dreamLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Gemini AI 꿈 심볼 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 해몽 분석 및 번호 추출
                    </>
                  )}
                </button>
              </div>

              {/* 오른쪽 결과 패널 */}
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
                    <p className="text-[10px] max-w-xs mt-1">
                      왼쪽 칸에 해몽할 꿈 내용을 입력하고 분석을 클릭하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* 상단 뱃지 */}
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <span className="text-[10px] font-bold text-slate-500">
                        {dreamResult.isRealAi ? "Gemini 1.5 Flash 실시간 AI 분석" : "로컬 매칭 분석 결과"}
                      </span>
                      <div className="flex gap-1.5">
                        {dreamResult.keywords.map((kw, i) => (
                          <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/60">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 해석 텍스트 */}
                    <div className="bg-slate-900/80 p-3.5 rounded border border-slate-900 text-xs text-slate-300 leading-5">
                      <p className="font-bold text-blue-400 mb-1">AI 해몽 진단</p>
                      {dreamResult.interpretation}
                    </div>

                    {/* 도출 번호 */}
                    <div className="text-center py-4 bg-slate-900/40 rounded border border-slate-900">
                      <span className="text-[10px] text-slate-500 block mb-2">꿈의 상징과 매칭된 행운의 6개 번호</span>
                      <div className="flex justify-center gap-1.5">
                        {dreamResult.numbers.map((n) => (
                          <span key={n} className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-lg ${getBallColor(n)}`}>
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 액션 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyToClipboard(dreamResult.numbers)}
                        className="flex-1 py-2 rounded bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                      >
                        클립보드 복사
                      </button>
                      <button
                        onClick={handleSaveDreamNumbers}
                        disabled={dreamSaveSuccess}
                        className={`flex-1 py-2 rounded text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all ${
                          dreamSaveSuccess
                            ? "bg-emerald-950 border-emerald-900 text-emerald-400 border"
                            : "bg-blue-600 hover:bg-blue-500"
                        }`}
                      >
                        {dreamSaveSuccess ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            보관함 저장 완료
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            보관함에 저장하기
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* 2.5 Footer Ad Banner (PRO 멤버가 아닐 때 노출) */}
      {!isProMember && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 mb-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-md">
            {/* Background glowing effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -z-10" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-950/60 border border-blue-900/50 rounded-lg text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded font-semibold tracking-wider uppercase inline-block mb-1">
                  SPONSORED ADVERTISEMENT
                </span>
                <h4 className="text-xs font-bold text-slate-200">
                  로또랩 프리미엄 분석 솔루션 - LottoLab PRO
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  한 달 커피값보다 저렴한 990원 후원으로 모든 광고를 영구 제거하고 더욱 정밀한 번호를 생성해보세요.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-600/10 shrink-0"
            >
              광고 제거하기 (월 990원)
            </button>
          </div>
        </div>
      )}

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

      {/* 4. Auth Modal (Login / Sign Up) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            
            {/* 닫기 */}
            <button
              onClick={resetAuthModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold"
            >
              &times;
            </button>

            {/* 타이틀 */}
            <div className="text-center mb-5">
              {authStep === "otp" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-900/50 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">이메일 인증</h3>
                  <p className="text-xs text-slate-400">
                    <span className="text-blue-400 font-semibold">{authEmail}</span>으로<br />
                    6자리 인증 코드를 발송했습니다.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {isSignUpMode ? "새로운 계정 생성" : "LottoLab 로그인"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isSignUpMode
                      ? "로또랩 분석 데이터를 보관하기 위해 가입하세요."
                      : "저장된 조합을 동기화하고 개인화 서비스를 사용하세요."}
                  </p>
                </>
              )}
            </div>

            {/* 에러/성공 피드백 */}
            {authError && (
              <div className="mb-4 p-2.5 bg-rose-950/40 border border-rose-900/40 text-rose-400 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccessMsg && (
              <div className="mb-4 p-2.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 text-xs rounded flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {authStep === "otp" ? (
              /* --- Step 2: OTP 입력 --- */
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-2 text-center">
                    인증 코드 6자리 입력
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ""));
                      setAuthError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleOtpVerify()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-2xl text-center text-white tracking-[0.6em] font-bold focus:outline-none focus:border-blue-500/80 placeholder-slate-700"
                    placeholder="000000"
                  />
                </div>

                {/* 만료 카운트다운 + 재발송 */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className={`font-mono font-bold ${otpCountdown <= 60 ? "text-rose-400" : "text-slate-400"}`}>
                    {otpCountdown > 0 ? `⏱ ${formatCountdown(otpCountdown)} 후 만료` : "코드가 만료되었습니다"}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpResendCooldown > 0 || authPending}
                    className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold transition-colors"
                  >
                    {otpResendCooldown > 0 ? `재발송 (${otpResendCooldown}s)` : "코드 재발송"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOtpVerify}
                  disabled={otpCode.length !== 6 || authPending}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all"
                >
                  {authPending ? "인증 확인 중..." : "인증 완료하기"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setAuthStep("form"); setAuthError(""); setOtpCode(""); }}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← 이메일 입력으로 돌아가기
                  </button>
                </div>

                <div className="p-2 bg-slate-950 rounded border border-slate-800/80 text-[10px] text-slate-500 text-center">
                  이메일이 오지 않으면 스팸 폴더를 확인해 주세요.
                </div>
              </div>
            ) : (
              /* --- Step 1: 로그인 / 회원가입 폼 --- */
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">이메일 주소</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/80"
                      placeholder="name@domain.com"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">비밀번호</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/80"
                      placeholder="6자리 이상 비밀번호"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authPending}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all shadow-md shadow-blue-600/10"
                  >
                    {authPending
                      ? "처리 중..."
                      : isSignUpMode
                        ? "인증 코드 받기"
                        : "로또랩 로그인"}
                  </button>
                </form>

                {/* 모드 전환 */}
                <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
                  {isSignUpMode ? (
                    <>
                      이미 계정이 있으신가요?{" "}
                      <button
                        onClick={() => { setIsSignUpMode(false); setAuthError(""); }}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        로그인으로 전환
                      </button>
                    </>
                  ) : (
                    <>
                      아직 계정이 없으신가요?{" "}
                      <button
                        onClick={() => { setIsSignUpMode(true); setAuthError(""); }}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        무료 회원가입
                      </button>
                    </>
                  )}
                </div>

                {/* 로컬 모드 안내 */}
                {isLocalMode && (
                  <div className="mt-4 p-2 bg-slate-950 rounded border border-slate-800/80 text-[10px] text-slate-400 text-center">
                    * 로컬 모드로 동작 중입니다. 임의의 이메일과 비밀번호를 입력하셔도 바로 로그인되며, 번호 저장 등 모든 기능이 브라우저에 임시 유지됩니다.
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* 5. Report Card Modal (역대 당첨 대조 성적표) */}
      {reportTargetSet && performanceReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setReportTargetSet(null);
                setPerformanceReport(null);
              }}
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
                    className={`w-8 h-8 rounded-full border text-xs font-extrabold flex items-center justify-center shadow-md ${getBallColor(
                      n
                    )}`}
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
              onClick={() => {
                setReportTargetSet(null);
                setPerformanceReport(null);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}

      {/* 6. Pro Support & Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
            >
              &times;
            </button>

            {/* 타이틀 */}
            <div className="text-center mb-5">
              <span className="text-[10px] font-extrabold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-900/60 inline-block mb-2 uppercase tracking-wide animate-pulse">
                Premium Support
              </span>
              <h3 className="text-lg font-bold text-white mb-1">로또랩 PRO 후원 & 멤버십</h3>
              <p className="text-xs text-slate-400">
                로또랩의 독립 연구 및 서버 유지를 지원하고 프리미엄 혜택을 누리세요.
              </p>
            </div>

            {/* 혜택 카드 */}
            <div className="mb-5 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block mb-1">PRO 멤버십 혜택</span>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>웹사이트 내 모든 광고(리스트 광고, 푸터 광고) 완전 제거</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>계정 프로필 및 화면 상단 황금빛 PRO 전용 배지 활성화</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>향후 제공될 고급 분석 알고리즘 우선권 제공</span>
              </div>
            </div>

            {isProMember ? (
              /* PRO 회원인 경우: 해지하기 */
              <div className="space-y-4 text-center">
                <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-lg">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-amber-300">현재 PRO 멤버십 활성 상태입니다</p>
                  <p className="text-[11px] text-slate-400 mt-1">로또랩 연구개발을 후원해 주셔서 진심으로 감사드립니다.</p>
                </div>
                
                <button
                  onClick={handleCancelMembership}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 rounded text-xs font-bold transition-all"
                >
                  멤버십 구독 해지하기
                </button>
              </div>
            ) : (
              /* PRO 회원이 아닌 경우: 결제/후원 선택 */
              <div className="space-y-4">
                
                {/* 1. 포트원 결제 */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">PortOne 정기 후원 결제</span>
                    </div>
                    <span className="text-[10px] text-slate-400">월 990원</span>
                  </div>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={paymentPending}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    {paymentPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        결제 모듈 호출 중...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        정기 구독 결제창 열기
                      </>
                    )}
                  </button>
                </div>

                {/* 2. 카카오페이 / 계좌 송금 후원 */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-200">카카오페이 / 계좌로 직접 후원</span>
                  </div>
                  
                  {/* QR 코드 모의 화면 */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 p-2.5 rounded border border-slate-800/80">
                    <div className="w-20 h-20 bg-white p-1 rounded shrink-0 flex items-center justify-center relative">
                      {/* QR Mockup using CSS grid/shapes */}
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold text-center">
                        KAKAO PAY
                        <br />
                        QR CODE
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-[10px] text-amber-400 font-bold">카카오페이 일시 송금 지원</p>
                      <p className="text-[10px] text-slate-400">
                        좌측 QR을 모바일 카메라로 스캔하거나 아래 가상 계좌로 원하시는 금액만큼 1회성 커피값 후원이 가능합니다.
                      </p>
                      <p className="text-[10px] text-slate-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 inline-block">
                        국민은행 990-2026-LOTTOLAB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProMember(true);
                      localStorage.setItem("lottolab_pro", "true");
                      toast.success("후원이 접수되었습니다! PRO 멤버십이 즉시 적용됩니다. 감사합니다.");
                      setShowPaymentModal(false);
                    }}
                    className="w-full mt-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 rounded text-[11px] font-bold transition-all"
                  >
                    송금/후원 완료 후 PRO 뱃지 켜기
                  </button>
                </div>

              </div>
            )}

            <div className="mt-4 text-center text-[10px] text-slate-500">
              * 포트원 결제는 테스트 모드(가상 결제)로 동작하며 실제 비용이 청구되지 않습니다.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
