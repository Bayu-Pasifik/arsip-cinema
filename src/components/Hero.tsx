import { forwardRef } from 'react';

interface Props {
  onEnter: () => void;
}

const Hero = forwardRef<HTMLElement, Props>(function Hero({ onEnter }, ref) {
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <p className="tag hero-fade">Arsip film · data TMDB</p>
      <h1 id="hero-title" className="hero-title">
        <span className="line-mask">
          <span className="line">Film, disusun</span>
        </span>
        <span className="line-mask">
          <span className="line">
            seperti <em>arsip.</em>
          </span>
        </span>
      </h1>
      <p className="hero-sub hero-fade">
        Tumpukan poster 3D dari film trending, populer, dan terbaik. Cari judul, balik kartunya, buka detailnya.
      </p>
      <div className="hero-cta hero-fade">
        <button type="button" className="btn btn-primary" onClick={onEnter}>
          Mulai menjelajah <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="hero-hint hero-fade">← → · gulir · geser</p>
    </section>
  );
});

export default Hero;
