import { imageUrl } from '../services/tmdb';
import type { GalleryImage } from './ImageLightbox';

interface Props {
  id: string;
  title: string;
  /** gambar yang ditampilkan di baris ini */
  items: GalleryImage[];
  /** indeks gambar pertama baris ini di dalam daftar gabungan lightbox */
  offset: number;
  onOpen: (index: number) => void;
}

/** Baris thumbnail galeri; klik membuka lightbox pada gambar tersebut. */
export default function ImageGallery({ id, title, items, offset, onOpen }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="gal" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="tag">
        {title}
      </h3>
      <ul className="mv-list">
        {items.map((img, k) => {
          const src = imageUrl(img.path, img.kind, img.kind === 'backdrop' ? 'w300' : 'w185');
          return (
            <li key={img.path} className={`gal-item gal-${img.kind}`}>
              <button type="button" className="gal-btn" onClick={() => onOpen(offset + k)} aria-haspopup="dialog">
                <img src={src ?? undefined} alt="" loading="lazy" width={img.width} height={img.height} />
                <span className="sr-only">
                  Buka gambar {k + 1} dari {items.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
