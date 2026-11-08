import type { CastMember, CreditMovie, CrewMember, Movie, MovieDetail } from '../types/tmdb';

/**
 * Serial TV memakai bentuk data yang sama dengan film (judul, poster, rilis, rating) supaya seluruh UI bisa dipakai ulang.
 * Agar id film dan id serial tidak bertabrakan (favorit, cache, rute detail), id TV disimpan dengan offset ini;
 * id asli TMDB dipulihkan dengan `rawId` saat memanggil API.
 */
export const TV_ID_OFFSET = 1_000_000_000;

export const tvId = (id: number): number => id + TV_ID_OFFSET;
export const isTvId = (id: number): boolean => id >= TV_ID_OFFSET;
export const rawId = (id: number): number => (isTvId(id) ? id - TV_ID_OFFSET : id);

/** Bentuk longgar item serial TV dari TMDB (daftar maupun detail). */
export interface TvRaw {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
}

export function normalizeTv(r: TvRaw): Movie {
  return {
    id: tvId(r.id),
    title: r.name ?? r.original_name ?? '',
    overview: r.overview ?? '',
    poster_path: r.poster_path ?? null,
    backdrop_path: r.backdrop_path ?? null,
    release_date: r.first_air_date ?? '',
    vote_average: r.vote_average ?? 0,
    vote_count: r.vote_count ?? 0,
    media: 'tv',
  };
}

type Loose = Record<string, unknown>;

interface AggCast {
  id: number;
  name: string;
  profile_path?: string | null;
  roles?: { character?: string; episode_count?: number }[];
  total_episode_count?: number;
}
interface AggCrew {
  id: number;
  name: string;
  jobs?: { job: string; episode_count?: number }[];
}
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Respons /tv/{id} (+ append_to_response) → MovieDetail yang dipahami UI detail film. */
export function normalizeTvDetail(raw: TvRaw & Loose): MovieDetail {
  const r = raw as Loose;
  const rel = (key: string) => {
    const o = r[key] as { results?: TvRaw[]; page?: number; total_pages?: number } | undefined;
    return o ? { results: list<TvRaw>(o.results).map(normalizeTv), page: o.page, total_pages: o.total_pages } : undefined;
  };
  const credits = r.credits as { cast?: unknown[]; crew?: unknown[] } | undefined;
  const agg = r.aggregate_credits as { cast?: AggCast[]; crew?: AggCrew[] } | undefined;
  const creators = list<{ id: number; name: string }>(r.created_by).map((c) => ({ id: c.id, name: c.name, job: 'Creator' }));
  const translations = r.translations as { translations?: Loose[] } | undefined;
  const ratings = (r.content_ratings as { results?: { iso_3166_1: string; rating: string }[] } | undefined)?.results;
  const runtimes = list<number>(r.episode_run_time);
  const last = r.last_episode_to_air as { runtime?: number | null } | null | undefined;

  return {
    ...normalizeTv(raw),
    tagline: (r.tagline as string) ?? '',
    runtime: runtimes[0] ?? last?.runtime ?? null,
    genres: list(r.genres),
    status: (r.status as string) ?? '',
    original_title: r.original_name as string | undefined,
    original_language: r.original_language as string | undefined,
    popularity: r.popularity as number | undefined,
    homepage: (r.homepage as string | undefined) ?? null,
    production_companies: list(r.production_companies),
    production_countries: list(r.production_countries),
    spoken_languages: list(r.spoken_languages),
    credits: credits || agg ? { cast: tvCast(agg, credits), crew: [...creators, ...tvCrew(agg, credits)] } : undefined,
    videos: r.videos as MovieDetail['videos'],
    recommendations: rel('recommendations'),
    similar: rel('similar'),
    images: r.images as MovieDetail['images'],
    reviews: r.reviews as MovieDetail['reviews'],
    'watch/providers': r['watch/providers'] as MovieDetail['watch/providers'],
    keywords: r.keywords ? { keywords: list((r.keywords as { results?: unknown[] }).results) } : undefined,
    external_ids: r.external_ids as MovieDetail['external_ids'],
    translations: translations
      ? {
          translations: list<Loose>(translations.translations).map((t) => {
            const d = (t.data ?? {}) as { name?: string; overview?: string; tagline?: string; homepage?: string };
            return { ...t, data: { title: d.name, overview: d.overview, tagline: d.tagline, homepage: d.homepage } };
          }) as NonNullable<MovieDetail['translations']>['translations'],
        }
      : undefined,
    release_dates: ratings
      ? { results: ratings.map((x) => ({ iso_3166_1: x.iso_3166_1, release_dates: [{ certification: x.rating, type: 3, release_date: '' }] })) }
      : undefined,
    number_of_seasons: r.number_of_seasons as number | undefined,
    number_of_episodes: r.number_of_episodes as number | undefined,
    seasons: list(r.seasons),
    networks: list(r.networks),
  };
}

/** Kredit serial TV seseorang (tv_credits) → bentuk kredit film, id ber-offset. */
export function normalizeTvCredit(r: TvRaw & { character?: string; popularity?: number }): CreditMovie {
  return { ...normalizeTv(r), popularity: r.popularity, character: r.character };
}

/** Pemeran serial: dari aggregate_credits (seluruh musim, dengan jumlah episode) bila ada, bila tidak dari credits biasa. */
function tvCast(agg: { cast?: AggCast[] } | undefined, credits: { cast?: unknown[] } | undefined): CastMember[] {
  if (agg?.cast?.length) {
    return agg.cast.map((c) => ({
      id: c.id,
      name: c.name,
      profile_path: c.profile_path ?? null,
      character: [...new Set((c.roles ?? []).map((x) => x.character?.trim()).filter((x): x is string => !!x))].slice(0, 2).join(' / '),
      episodes: c.total_episode_count,
    }));
  }
  return list<CastMember>(credits?.cast);
}

/** Kru serial: satu baris per (orang, jabatan) dari aggregate_credits, bila tidak dari credits biasa. */
function tvCrew(agg: { crew?: AggCrew[] } | undefined, credits: { crew?: unknown[] } | undefined): CrewMember[] {
  if (agg?.crew?.length) return agg.crew.flatMap((c) => (c.jobs ?? []).map((j) => ({ id: c.id, name: c.name, job: j.job })));
  return list<CrewMember>(credits?.crew);
}
