/** Nama negara: dari Intl bila dikenal; bila Intl hanya mengembalikan kodenya, pakai nama dari TMDB; terakhir kodenya. */
export function regionLabel(code: string, intlName: string, tmdbNames: ReadonlyMap<string, string>): string {
  return intlName && intlName !== code ? intlName : (tmdbNames.get(code) ?? code);
}

/** Urutkan kode negara menurut label-nya (abjad menurut bahasa aktif). */
export function sortRegions(codes: readonly string[], label: (code: string) => string, locale: string): string[] {
  return [...codes].sort((a, b) => label(a).localeCompare(label(b), locale));
}
