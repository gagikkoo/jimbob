// 56800 -> "56.8K", 3400000 -> "3.4M"
export function compact(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e9) return trim(n / 1e9) + "B";
  if (n >= 1e6) return trim(n / 1e6) + "M";
  if (n >= 1e3) return trim(n / 1e3) + "K";
  return String(Math.round(n));
}
function trim(v) {
  return (v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "");
}
