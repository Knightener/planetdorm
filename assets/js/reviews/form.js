// Write-a-review form: hCaptcha + Supabase edge function (RLS blocks
// direct writes).
import { dorm, PENDING_KEY, SITEKEY, SUBMIT_URL, ANON_JWT } from './config.js';
import { academicYears, showToast } from './util.js';
import { loadPendingStore } from './list.js';
import { loadReviews } from './load.js';

let formRating = 0;
let formYear = '';
let formCaptchaId = null;

function renderFormStars() {
  document.getElementById('formStars').innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<span class="${n <= formRating ? 'filled' : ''}" data-n="${n}">★</span>`).join('');
  document.querySelectorAll('#formStars span').forEach(s =>
    s.addEventListener('click', () => { formRating = +s.dataset.n; renderFormStars(); }));
}

function renderFormYears() {
  document.getElementById('formYears').innerHTML = academicYears(11).map(y =>
    `<button type="button" class="td-year ${formYear === y ? 'active' : ''}" data-y="${y}">${y}</button>`).join('');
  document.querySelectorAll('#formYears .td-year').forEach(b =>
    b.addEventListener('click', () => { formYear = b.dataset.y; renderFormYears(); }));
}

function openForm() {
  const form = document.getElementById('reviewForm');
  form.hidden = false;
  renderFormStars();
  renderFormYears();
  if (formCaptchaId === null && typeof hcaptcha !== 'undefined') {
    formCaptchaId = hcaptcha.render('formCaptcha', {
      sitekey: SITEKEY,
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    });
  }
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  formRating = 0; formYear = '';
  document.getElementById('formName').value = '';
  document.getElementById('formText').value = '';
  document.getElementById('charCount').textContent = '0 / 2000';
  if (formCaptchaId !== null && typeof hcaptcha !== 'undefined') hcaptcha.reset(formCaptchaId);
  document.getElementById('reviewForm').hidden = true;
}

async function submitReview() {
  const name = document.getElementById('formName').value.trim() || 'Anonymous Terp';
  const text = document.getElementById('formText').value.trim();

  if (!formYear) return showToast('Please select the year you lived there.', 'error');
  if (formRating === 0) return showToast('Please select a star rating before submitting.', 'error');
  if (!text) return showToast('Please write something before submitting.', 'error');
  if (name.length > 100) return showToast('Name is too long (max 100 characters).', 'error');
  if (text.length > 2000) return showToast('Review is too long (max 2000 characters).', 'error');

  const captchaToken = (typeof hcaptcha !== 'undefined' && formCaptchaId !== null)
    ? hcaptcha.getResponse(formCaptchaId) : '';
  if (!captchaToken) return showToast('Please complete the captcha before submitting.', 'error');

  let res;
  try {
    res = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_JWT}` },
      body: JSON.stringify({ dormId: dorm.id, name, rating: formRating, text, year: formYear, captchaToken })
    });
  } catch (err) {
    console.error('[submit-review] Network error:', err);
    return showToast('Network error. Please try again.', 'error');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[submit-review] Failed:', res.status, body);
    return showToast(body.error || 'Failed to submit review. Please try again later.', 'error');
  }

  // Keep a local copy of the pending review so the poster sees it right away;
  // it stays private to this browser until approved.
  const body = await res.json().catch(() => ({}));
  if (body.review && body.review.id != null) {
    localStorage.setItem(PENDING_KEY, JSON.stringify([...loadPendingStore(), body.review]));
  }

  closeForm();
  showToast('Review submitted! Only you can see it until it gets approved.', 'success');
  loadReviews();
}

document.getElementById('writeReviewLink').addEventListener('click', openForm);
document.getElementById('formCancel').addEventListener('click', closeForm);
document.getElementById('formSubmit').addEventListener('click', submitReview);
document.getElementById('formText').addEventListener('input', function () {
  document.getElementById('charCount').textContent = `${this.value.length} / 2000`;
});
