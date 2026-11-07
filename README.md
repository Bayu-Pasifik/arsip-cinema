# Arsip Sinema

Penjelajah film berbasis tumpukan poster 3D (tema terang). React + TypeScript + Vite, Three.js (React Three Fiber), GSAP, dan TMDB API.

## Menjalankan

```bash
npm install
cp .env.example .env      # lalu isi VITE_TMDB_API_KEY
npm run dev               # http://localhost:5173
npm run build             # typecheck + build produksi
npm run preview
```

## Memasang `VITE_TMDB_API_KEY`

1. Daftar/masuk di https://www.themoviedb.org lalu buka **Settings → API** (https://www.themoviedb.org/settings/api).
2. Ajukan kunci API (gratis, untuk penggunaan non-komersial).
3. Salin **API Key (v3)** — atau **API Read Access Token (v4)**, keduanya didukung — ke `.env`:
   ```
   VITE_TMDB_API_KEY=kunci_anda
   ```
4. Restart `npm run dev` (Vite hanya membaca `.env` saat start).

Tanpa kunci, aplikasi menampilkan pesan konfigurasi dan tombol untuk melihat antarmuka dengan **placeholder demo** (berlabel "DEMO", bukan data film).

> Catatan keamanan: variabel `VITE_*` ikut masuk ke bundel browser, jadi kunci TMDB terlihat oleh pengunjung situs yang dipublikasikan. Untuk produksi publik, letakkan proxy server di depan TMDB.

## Proxy gambar & deploy (penting)

`image.tmdb.org` tidak mengirim header CORS, jadi poster tidak bisa dipakai sebagai tekstur WebGL secara langsung. Tekstur dimuat lewat jalur same-origin `/tmdb-img/<ukuran>/<path>` yang harus di-proxy ke `https://image.tmdb.org/t/p/`. Gambar HTML biasa (thumbnail, foto pemeran) memakai URL TMDB langsung dan tidak perlu proxy.

| Lingkungan | Cara |
| --- | --- |
| `npm run dev` / `npm run preview` | otomatis, proxy di `vite.config.ts` |
| Netlify | `public/_redirects` (ikut ter-copy ke `dist`) — proxy gambar + fallback SPA |
| Vercel | `vercel.json` — rewrite gambar + fallback SPA |
| Nginx / server sendiri | `deploy/nginx.conf.example` (proxy + cache 7 hari + `try_files` ke `index.html`) |
| Proxy/CDN di alamat lain | set `VITE_TMDB_IMG_BASE` (mis. `https://img.contoh.com/tmdb`) saat build |

Jika proxy tidak terpasang, poster 3D menampilkan kartu placeholder berlabel "POSTER GAGAL DIMUAT" (bukan layar kosong); aplikasi tetap bisa dipakai lewat thumbnail dan caption. Konfigurasi Netlify/Vercel/Nginx belum diuji di platform aslinya; yang sudah diuji adalah build produksi lewat `vite preview` (proxy gambar dan fallback SPA).

## Fitur

- Pembuka sinematik → masuk ke tumpukan kartu poster 3D diagonal (terinspirasi pola "card stack" di motionsites.ai, bukan salinan), kamera dengan parallax halus.
- Paginasi: daftar dimuat per halaman TMDB (20 film) dan halaman berikutnya diambil otomatis saat fokus mendekati akhir (5 film terakhir), hingga 100 film per daftar. Tombol "+" di ujung rel memuat manual; bila gagal berubah jadi "↻" untuk mencoba lagi. Tekstur poster hanya dimuat saat poster mendekati fokus.
- Favorit & Watchlist: tombol ♡ Favorit / ＋ Watchlist di caption galeri dan halaman detail (toggle, `aria-pressed`, diumumkan ke pembaca layar). Disimpan di `localStorage` (`arsip.collections.v1`, sinkron antar tab, maks. 200 film per daftar) sebagai salinan ringkas sehingga daftar tampil tanpa memanggil API. Tab **Favorit** dan **Watchlist** (`/browse/favorites`, `/browse/watchlist`) menampilkan daftar itu dengan lencana jumlah. Tidak memakai akun TMDB; data hanya ada di browser ini. Film demo tidak dapat disimpan.
- Kategori: Trending (`/trending/movie/week`), Popular, Top Rated, Now Playing.
- Pencarian TMDB (`/search/movie`) dengan debounce 400 ms, indikator loading, state kosong/error, dan pembatalan request lama (`AbortController`).
- Detail film (halaman scroll 3D: GSAP ScrollTrigger + Three.js): poster, backdrop, tagline, durasi, rating, genre, sinopsis, sutradara, pemeran (`/movie/{id}?append_to_response=credits`).
- Trailer: tombol "Putar trailer" di halaman detail membuka lightbox YouTube (youtube-nocookie, iframe baru dibuat saat dibuka). Trailer dipilih dari `videos` TMDB: resmi → bahasa Indonesia → Inggris → terbaru; tombol tidak muncul bila film tidak punya trailer YouTube.
- Navigasi: ← → / Home / End, gulir roda, geser, klik poster (poster fokus → buka detail), rel thumbnail, tombol Sebelumnya/Berikutnya. Esc menutup detail; fokus dikurung dan dikembalikan.
- `prefers-reduced-motion`: semua transisi GSAP menjadi instan, parallax dan partikel dimatikan, render 3D hanya saat perlu (`frameloop="demand"`).
- Layar kecil: DPR 1, tanpa antialias, partikel dikurangi, tekstur `w185`, kamera menyesuaikan rasio potret. Rel thumbnail menjamin akses konten.

## Struktur

```
src/
  services/tmdb.ts      klien TMDB, error terklasifikasi, URL gambar
  services/demo.ts      placeholder demo berlabel
  hooks/                useMovieList, useMovieDetail, useEnv (media query, debounce)
  scene/                ArchiveScene, Poster, stage (state yang dimutasi GSAP), usePosterTexture
  components/           Hero, TopBar, Browse, DetailPanel, StatusMessage
  types/tmdb.ts
  styles.css
```

## Asumsi

- Bahasa data TMDB `id-ID` (konstanta `LANGUAGE` di `src/services/tmdb.ts`); bila sinopsis Indonesia kosong, detail memakai `en-US` dan diberi label.
- Setiap daftar dibatasi 20 film (halaman pertama TMDB).
- Referensi gerak (motionsites.ai) hanya dijadikan inspirasi umum (reveal baris judul, transisi kamera, stagger); tidak ada desain yang disalin.

## Routing

Router mini berbasis History API (`src/hooks/useRoute.ts`, tanpa dependensi):

| URL | Tampilan |
| --- | --- |
| `/` | pembuka |
| `/browse/:category?q=judul` | galeri (`trending`, `popular`, `top_rated`, `now_playing`); pencarian tersimpan di `?q=` |
| `/movie/:id` | halaman detail film (dapat dibuka langsung/dibagikan) |

Tombol Back/Forward browser berfungsi: membuka detail menambah riwayat, menutupnya (tombol Kembali atau Esc) kembali ke riwayat sebelumnya. Untuk tautan langsung, hosting statis harus mengarahkan semua path ke `index.html` (Vite dev/preview sudah melakukannya; di Netlify/Vercel tambahkan rewrite SPA).

## Fallback tanpa WebGL

`src/utils/webgl.ts` mendeteksi dukungan WebGL saat start, dan `SceneBoundary` (error saat membuat Canvas) serta `ContextWatch` (event `webglcontextlost`) memicu fallback saat runtime. Bila WebGL tidak tersedia:

- Galeri memakai `FlatStack`: tumpukan kartu yang sama dengan CSS transform.
- Halaman detail tetap di-scrub oleh ScrollTrigger; poster 3D diganti poster HTML yang bergeser per bab (cincin rating 3D tidak ada, angka rating tetap menghitung naik).
- Banner kecil menjelaskan "Mode 2D". Fallback tidak otomatis kembali ke 3D sampai halaman dimuat ulang.

Untuk menguji: buka `/?webgl=off`, atau di konsol browser panggil `WEBGL_lose_context.loseContext()` pada canvas.

## Lint & tes

```bash
npm run lint     # ESLint (typescript-eslint + react-hooks), tanpa peringatan
npm test         # Vitest, sekali jalan (npm run test:watch untuk mode pantau)
npm run build    # typecheck + build produksi
```

Cakupan tes (33 kasus, environment Node): klien TMDB (URL gambar & proxy, kunci v3/v4, pemetaan endpoint, klasifikasi error 401/404/429/5xx/jaringan/abort, batas `MAX_ITEMS`, cadangan sinopsis `en-US`), parser rute (`parseRoute`, `browsePath`, `moviePath`), utilitas format, dan data demo. Belum ada tes komponen React maupun adegan 3D; bagian itu diverifikasi manual di browser.
