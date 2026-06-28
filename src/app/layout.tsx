import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://lottolab-sigma.vercel.app";

const ADSENSE_CLIENT_ID = "ca-pub-4909104591449651";

export const metadata: Metadata = {
  title: "LottoLab (로또랩) - 스마트 로또 번호 추천 및 분석",
  description: "통계 데이터 필터링과 AI 기술을 결합한 신뢰할 수 있는 로또 번호 분석 및 추천 연구소",
  metadataBase: new URL(BASE_URL),
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "LottoLab (로또랩)",
    title: "LottoLab (로또랩) - 스마트 로또 번호 추천 및 분석",
    description: "통계 데이터 필터링과 AI 기술을 결합한 신뢰할 수 있는 로또 번호 분석 및 추천 연구소",
    locale: "ko_KR",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LottoLab - 스마트 로또 번호 추천 및 분석",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LottoLab (로또랩) - 스마트 로또 번호 추천 및 분석",
    description: "통계 데이터 필터링과 AI 기술을 결합한 신뢰할 수 있는 로또 번호 분석 및 추천 연구소",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
          <Toaster theme="light" position="bottom-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
