"use client";

import React, { useState } from "react";
import { KeyRound, AlertCircle, CheckCircle, X, Mail, ChevronDown } from "lucide-react";

interface AuthModalProps {
  isSignUpMode: boolean;
  authEmail: string;
  authPassword: string;
  authError: string;
  authSuccessMsg: string;
  authPending: boolean;
  authStep: "form" | "otp";
  otpCode: string;
  otpResendCooldown: number;
  isLocalMode: boolean;
  setIsSignUpMode: (v: boolean) => void;
  setAuthEmail: (v: string) => void;
  setAuthPassword: (v: string) => void;
  setAuthError: (v: string) => void;
  setOtpCode: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOtpVerify: () => void;
  onResendOtp: () => void;
  onBackToForm: () => void;
}

export default function AuthModal({
  isSignUpMode,
  authEmail,
  authPassword,
  authError,
  authSuccessMsg,
  authPending,
  authStep,
  otpCode,
  otpResendCooldown,
  isLocalMode,
  setIsSignUpMode,
  setAuthEmail,
  setAuthPassword,
  setAuthError,
  setOtpCode,
  onClose,
  onSubmit,
  onOtpVerify,
  onResendOtp,
  onBackToForm,
}: AuthModalProps) {
  const [showOtpInput, setShowOtpInput] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl relative overflow-hidden">

        {/* 상단 장식 */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />

        <div className="p-6">
          {/* 닫기 */}
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>

          {/* 타이틀 */}
          <div className="text-center mb-6">
            {authStep === "otp" ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">이메일 인증</h3>
                <p className="text-xs text-slate-500">메일함을 확인하고 인증 링크를 클릭해 주세요.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎱</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isSignUpMode ? "무료 회원가입" : "LottoLab 로그인"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSignUpMode ? "번호 보관함과 맞춤 필터를 무료로 이용하세요." : "저장된 조합을 동기화하고 개인화 서비스를 사용하세요."}
                </p>
              </>
            )}
          </div>

          {/* 에러/성공 피드백 */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
          {authSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {authStep === "otp" ? (
            <div className="space-y-4">
              {/* 메인: 이메일 링크 클릭 안내 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-800 mb-1">
                    <span className="font-extrabold">{authEmail}</span> 으로<br />인증 메일을 발송했습니다.
                  </p>
                  <p className="text-[11px] text-indigo-600">메일함을 열어 <strong>인증 링크</strong>를 클릭하면<br />자동으로 로그인됩니다.</p>
                </div>
                <p className="text-[10px] text-indigo-400">링크를 클릭하면 이 창은 자동으로 닫힙니다.</p>
              </div>

              {/* 재발송 + 돌아가기 */}
              <div className="flex items-center justify-between text-xs px-1">
                <button type="button" onClick={onBackToForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                  ← 돌아가기
                </button>
                <button type="button" onClick={onResendOtp} disabled={otpResendCooldown > 0 || authPending}
                  className="text-indigo-600 hover:text-indigo-700 disabled:text-slate-300 font-semibold transition-colors">
                  {otpResendCooldown > 0 ? `재발송 (${otpResendCooldown}s)` : "메일 재발송"}
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-400 text-center">
                메일이 오지 않으면 스팸 폴더를 확인해 주세요.
              </div>

              {/* 코드 직접 입력 (접기/펼치기) */}
              <button type="button" onClick={() => setShowOtpInput(v => !v)}
                className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronDown className={`w-3 h-3 transition-transform ${showOtpInput ? "rotate-180" : ""}`} />
                코드를 직접 입력할게요
              </button>

              {showOtpInput && (
                <div className="space-y-3 pt-1">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    maxLength={6} autoFocus
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && onOtpVerify()}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-2xl text-center text-slate-900 tracking-[0.6em] font-bold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300"
                    placeholder="000000"
                  />
                  <button type="button" onClick={onOtpVerify} disabled={otpCode.length !== 6 || authPending}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
                    {authPending ? "확인 중..." : "코드로 인증"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={onSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">이메일 주소</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="name@domain.com" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">비밀번호</label>
                  <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="6자리 이상 비밀번호" />
                </div>
                <button type="submit" disabled={authPending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] mt-1 shadow-sm">
                  {authPending ? "처리 중..." : isSignUpMode ? "인증 코드 받기" : "로그인"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                {isSignUpMode ? (
                  <>이미 계정이 있으신가요?{" "}<button onClick={() => { setIsSignUpMode(false); setAuthError(""); }} className="text-indigo-600 hover:underline font-bold">로그인</button></>
                ) : (
                  <>아직 계정이 없으신가요?{" "}<button onClick={() => { setIsSignUpMode(true); setAuthError(""); }} className="text-indigo-600 hover:underline font-bold">무료 회원가입</button></>
                )}
              </div>

              {isLocalMode && (
                <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-700 text-center">
                  * 로컬 모드: 임의 이메일/비밀번호로 바로 로그인되며, 번호 저장 등이 브라우저에 임시 유지됩니다.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
