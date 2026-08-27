/* Photo viewer: rounded image with a thumbnail selector underneath. The
 * strip lists every photo the hall has (it collapses when there is only
 * one) and the page is locked from scrolling while the viewer is open. */
import { dorm } from './config.js';

let lightboxPhotos = [];

function showLightboxPhoto(i) {
  if (!lightboxPhotos[i]) return;
  document.getElementById('lightboxImg').src = lightboxPhotos[i];
  document.querySelectorAll('#lightboxStrip .td-lightbox-thumb')
    .forEach((t, n) => t.classList.toggle('active', n === i));
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.classList.remove('lightbox-open');
}

// The gallery cell is rendered with an inline onclick; module functions
// aren't global, so expose it explicitly.
window.openLightbox = function (src) {
  const all = dorm?.imgs?.length ? dorm.imgs : [src];
  lightboxPhotos = all.includes(src) ? all : [src, ...all];

  const strip = document.getElementById('lightboxStrip');
  // A single photo needs no selector.
  strip.innerHTML = lightboxPhotos.length > 1
    ? lightboxPhotos.map((p, i) =>
        `<button class="td-lightbox-thumb" data-i="${i}" style="background-image:url('${p.replace(/'/g, "\\'")}')" aria-label="Photo ${i + 1}"></button>`).join('')
    : '';
  strip.querySelectorAll('.td-lightbox-thumb').forEach(t => {
    t.addEventListener('click', () => showLightboxPhoto(Number(t.dataset.i)));
  });

  showLightboxPhoto(lightboxPhotos.indexOf(src));
  document.getElementById('lightbox').classList.add('active');
  document.body.classList.add('lightbox-open');
};

// Click the backdrop (not the photo or the strip) to dismiss.
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target.id === 'lightbox') closeLightbox();
});
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const cur = lightboxPhotos.indexOf(document.getElementById('lightboxImg').src);
    const step = e.key === 'ArrowRight' ? 1 : -1;
    showLightboxPhoto((cur + step + lightboxPhotos.length) % lightboxPhotos.length);
  }
});
