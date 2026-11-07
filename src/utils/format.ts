export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function formatRuntime(min: number | null): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}j ${m}m` : `${m}m`;
}
