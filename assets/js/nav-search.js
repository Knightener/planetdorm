/* Hall search in the nav bar: type-ahead over all on-campus halls; pick
 * one to jump to its page. Desktop: the icon next to the logo opens a
 * full-width bar under the nav. Mobile: the nav-right icon grows an
 * inline input. One shared input/menu pair is slotted into whichever
 * spot matches the viewport.
 *
 * Self-contained — it only needs the hall list, so any page carrying the
 * same nav markup can import it. */
import { dorms } from './data.js';
import { escHtml, areaBadge } from './reviews/util.js';

const navSearch = document.getElementById('navSearch');
const navSearchBtn = document.getElementById('navSearchBtn');
const navSearchBtnDesktop = document.getElementById('navSearchBtnDesktop');
const navSearchBar = document.getElementById('navSearchBar');
const navSearchBarSlot = document.getElementById('navSearchBarSlot');
const searchInput = document.getElementById('dormSearch');
const searchMenu = document.getElementById('dormSearchMenu');
const mqDesktop = window.matchMedia('(min-width: 769px)');

function placeSearch() {
  if (mqDesktop.matches) {
    navSearchBarSlot.append(searchInput, searchMenu);
  } else {
    navSearch.insertBefore(searchInput, navSearchBtn);
    navSearch.append(searchMenu);
  }
}

function isSearchOpen() {
  return !navSearchBar.hidden || navSearch.classList.contains('open');
}

function openNavSearch() {
  if (mqDesktop.matches) navSearchBar.hidden = false;
  else navSearch.classList.add('open');
  navSearchBtn.setAttribute('aria-expanded', 'true');
  navSearchBtnDesktop.setAttribute('aria-expanded', 'true');
  searchInput.removeAttribute('tabindex');
  searchInput.focus();
}

function closeNavSearch() {
  navSearchBar.hidden = true;
  navSearch.classList.remove('open');
  navSearchBtn.setAttribute('aria-expanded', 'false');
  navSearchBtnDesktop.setAttribute('aria-expanded', 'false');
  searchInput.setAttribute('tabindex', '-1');
  searchInput.value = '';
  searchMenu.hidden = true;
  searchMenu.innerHTML = '';
}

function toggleNavSearch() {
  if (isSearchOpen()) closeNavSearch();
  else openNavSearch();
}

function renderSearchMenu() {
  const q = searchInput.value.trim().toLowerCase();
  const matches = q
    ? dorms.filter(d => d.campus === 'on' && d.name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  if (!matches.length) { searchMenu.hidden = true; searchMenu.innerHTML = ''; return; }
  searchMenu.innerHTML = matches.map(d => `
    <button type="button" data-id="${d.id}">
      <span>${escHtml(d.name)}</span>
      <span class="area">${escHtml(areaBadge(d))}</span>
    </button>`).join('');
  searchMenu.hidden = false;
}

navSearchBtn.addEventListener('click', toggleNavSearch);
navSearchBtnDesktop.addEventListener('click', toggleNavSearch);

// Crossing the breakpoint closes the search and re-slots the input.
mqDesktop.addEventListener('change', () => { closeNavSearch(); placeSearch(); });
placeSearch();

searchInput.addEventListener('input', renderSearchMenu);
searchInput.addEventListener('focus', renderSearchMenu);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMenu.querySelector('button')?.click();
  if (e.key === 'Escape') closeNavSearch();
});
searchMenu.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (btn) location.href = `dorm-reviews.html?dorm=${encodeURIComponent(btn.dataset.id)}`;
});
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-search, .nav-search-btn-desktop, .nav-search-bar')) closeNavSearch();
});
