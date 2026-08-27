// v2 theme model: light is the default (no attribute); dark is opt-in via
// data-theme="dark". Persisted in localStorage under "pd2-theme".
//
// Loaded as a classic, render-blocking <script src> in <head> so the attribute
// is set before first paint (no flash) and toggleTheme() stays global for the
// inline onclick handlers in the nav.
(function(){
  var saved = localStorage.getItem('pd2-theme');
  var dark = saved ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.dataset.theme = 'dark';
})();

function toggleTheme(){
  var root = document.documentElement;
  var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  if (next === 'dark') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  localStorage.setItem('pd2-theme', next);
  // Only the map pages define this; a no-op everywhere else.
  if (window.refreshMapTheme) window.refreshMapTheme();
}
