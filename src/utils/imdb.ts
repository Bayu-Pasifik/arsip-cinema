/** ID IMDb film/orang: "tt" atau "nm" + 6–9 digit (mis. tt0133093). */
export const IMDB_ID = /^(tt|nm)[0-9]{6,9}$/i;

export const isImdbId = (s: string): boolean => IMDB_ID.test(s.trim());
