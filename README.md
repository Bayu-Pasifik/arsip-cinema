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

## Proxy gambar (penting)

`image.tmdb.org` tidak mengirim header CORS, sehingga poster tidak bisa dipakai sebagai tekstur WebGL secara langsung. Tekstur dimuat lewat jalur same-origin `/tmdb-img/<ukuran>/<path>` yang di-proxy ke `https://image.tmdb.org/t/p/` oleh Vite (`vite.config.ts`, berlaku untuk `dev` dan `preview`). Saat deploy statis, tambahkan rewrite yang sama di hosting Anda (Netlify/Vercel/Nginx). Gambar HTML biasa (thumbnail, detail) memakai URL TMDB langsung.

## Fitur

- Pembuka sinematik → masuk ke tumpukan kartu poster 3D diagonal (terinspirasi pola "card stack" di motionsites.ai, bukan salinan), kamera dengan parallax halus.
- Kategori: Trending (`/trending/movie/week`), Popular, Top Rated, Now Playing.
- Pencarian TMDB (`/search/movie`) dengan debounce 400 ms, indikator loading, state kosong/error, dan pembatalan request lama (`AbortController`).
- Detail film (halaman scroll 3D: GSAP ScrollTrigger + Three.js): poster, backdrop, tagline, durasi, rating, genre, sinopsis, sutradara, pemeran (`/movie/{id}?append_to_response=credits`).
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
