"use client";

import { Lock, TrendingUp, Play, Brain, FolderHeart, BarChart2, Shuffle, Bookmark } from "lucide-react";

type GatedTab = "locker" | "stats" | "simulator" | "dream";

interface TabMeta {
  title: string;
  description: string;
  features: string[];
}

const TAB_META: Record<GatedTab, TabMeta> = {
  locker: {
    title: "내 번호 보관함",
    description: "로그인하면 생성한 번호를 영구 저장하고 어디서든 불러올 수 있습니다.",
    features: ["번호 조합 영구 저장", "기기 간 동기화", "저장 날짜 & 메모 관리"],
  },
  stats: {
    title: "당첨 통계 분석",
    description: "역대 당첨 데이터를 분석해 확률 높은 패턴을 파악하세요.",
    features: ["최다/최소 출현 번호 분석", "홀짝 · 합계 분포 통계", "회차별 상세 데이터 조회"],
  },
  simulator: {
    title: "모의 투자 시뮬레이터",
    description: "가상 투자로 전략을 검증하고 수익률을 시뮬레이션해 보세요.",
    features: ["주간/월간 자동 구매 시뮬레이션", "투자 대비 수익률 분석", "전략별 성과 비교"],
  },
  dream: {
    title: "꿈 해몽 AI",
    description: "꿈 내용을 입력하면 AI가 번호를 추천해 드립니다.",
    features: ["Gemini AI 실시간 해몽 분석", "키워드 기반 번호 매핑", "해몽 결과 보관함 저장"],
  },
};

const TAB_ICONS: Record<GatedTab, React.ReactNode> = {
  locker: <FolderHeart className="w-6 h-6 text-blue-400" />,
  stats: <TrendingUp className="w-6 h-6 text-blue-400" />,
  simulator: <Play className="w-6 h-6 text-blue-400" />,
  dream: <Brain className="w-6 h-6 text-blue-400" />,
};

const FEATURE_ICONS = [BarChart2, Shuffle, Bookmark];

interface Props {
  tab: GatedTab;
  onLogin: () => void;
}

export default function LoginGateCard({ tab, onLogin }: Props) {
  const meta = TAB_META[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* 잠금 아이콘 + 타이틀 */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              {TAB_ICONS[tab]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
              <Lock className="w-3 h-3 text-slate-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{meta.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{meta.description}</p>
          </div>
        </div>

        {/* 기능 미리보기 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">로그인 후 이용 가능</p>
          {meta.features.map((feat, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                {feat}
              </div>
            );
          })}
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={onLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          로그인 / 무료 회원가입
        </button>
        <p className="text-center text-[10px] text-slate-500">
          이미 계정이 있다면 이메일로 즉시 로그인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
