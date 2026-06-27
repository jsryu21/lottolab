"use client";

import React from "react";
import { KeyRound, AlertCircle, CheckCircle } from "lucide-react";

interface AuthModalProps {
  isSignUpMode: boolean;
  authEmail: string;
  authPassword: string;
  authError: string;
  authSuccessMsg: string;
  authPending: boolean;
  authStep: "form" | "otp";
  otpCode: string;
  otpCountdown: number;
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
  formatCountdown: (sec: number) => string;
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
  otpCountdown,
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
  formatCountdown,
  onBackToForm,
}: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative">

        {/* 닫기 */}
        <button
          onClick={onClose}
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
                onKeyDown={(e) => e.key === "Enter" && onOtpVerify()}
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
                onClick={onResendOtp}
                disabled={otpResendCooldown > 0 || authPending}
                className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-semibold transition-colors"
              >
                {otpResendCooldown > 0 ? `재발송 (${otpResendCooldown}s)` : "코드 재발송"}
              </button>
            </div>

            <button
              type="button"
              onClick={onOtpVerify}
              disabled={otpCode.length !== 6 || authPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-bold active:scale-[0.98] transition-all"
            >
              {authPending ? "인증 확인 중..." : "인증 완료하기"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onBackToForm}
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
            <form onSubmit={onSubmit} className="space-y-4">
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
  );
}
