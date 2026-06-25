export function getLottoBallColor(num: number): string {
  if (num >= 1 && num <= 10) return "bg-amber-400 text-amber-950 border-amber-500 shadow-amber-500/20";
  if (num >= 11 && num <= 20) return "bg-blue-500 text-white border-blue-600 shadow-blue-500/20";
  if (num >= 21 && num <= 30) return "bg-rose-500 text-white border-rose-600 shadow-rose-500/20";
  if (num >= 31 && num <= 40) return "bg-slate-500 text-white border-slate-600 shadow-slate-500/20";
  return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
}
