import { forwardRef } from 'react';
import { useT } from '../i18n';

interface Props {
  onEnter: () => void;
}

const Hero = forwardRef<HTMLElement, Props>(function Hero({ onEnter }, ref) {
  const t = useT();
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <p className="tag hero-fade">{t('hero.tag')}</p>
      <h1 id="hero-title" className="hero-title">
        <span className="line-mask">
          <span className="line">{t('hero.line1')}</span>
        </span>
        <span className="line-mask">
          <span className="line">
            {t('hero.line2')} <em>{t('hero.line2em')}</em>
          </span>
        </span>
      </h1>
      <p className="hero-sub hero-fade">
        {t('hero.sub')}
      </p>
      <div className="hero-cta hero-fade">
        <button type="button" className="btn btn-primary" onClick={onEnter}>
          {t('hero.cta')} <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="hero-hint hero-fade">{t('hero.hint')}</p>
    </section>
  );
});

export default Hero;
