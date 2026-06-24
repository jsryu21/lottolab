import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LottoLab - 스마트 로또 번호 추천 및 분석";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🎱
          </div>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#f1f5f9" }}>LottoLab</span>
        </div>
        <p style={{ fontSize: 28, color: "#94a3b8", margin: 0, textAlign: "center", maxWidth: 800 }}>
          스마트 로또 번호 추천 및 분석
        </p>
        <p style={{ fontSize: 20, color: "#475569", margin: "16px 0 0", textAlign: "center", maxWidth: 700 }}>
          통계 데이터 필터링 · AI 꿈 해몽 · 역대 대조 시뮬레이터
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["번호 생성기", "당첨 통계", "모의 투자", "꿈 해몽 AI"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: 9999,
                background: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(37,99,235,0.4)",
                color: "#93c5fd",
                fontSize: 18,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
