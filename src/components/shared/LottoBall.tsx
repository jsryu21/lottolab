"use client";

import { getLottoBallColor } from "@/lib/getLottoBallColor";

interface LottoBallProps {
  num: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-6 h-6 text-[9px]",
  md: "w-7 h-7 text-[11px]",
  lg: "w-8 h-8 text-xs",
};

export default function LottoBall({ num, size = "md", className = "" }: LottoBallProps) {
  return (
    <span
      className={`rounded-full border font-extrabold flex items-center justify-center shadow-lg ${SIZE_CLASS[size]} ${getLottoBallColor(num)} ${className}`}
    >
      {num}
    </span>
  );
}
