import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// image.tmdb.org tidak mengirim header CORS, sehingga tekstur WebGL harus lewat proxy same-origin.
const imgProxy = {
  '/tmdb-img': {
    target: 'https://image.tmdb.org',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/tmdb-img/, '/t/p'),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: imgProxy },
  preview: { proxy: imgProxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          gsap: ['gsap', '@gsap/react'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
