// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the finished cover on its own. Query knobs:
// layout, theme, photo (pier | boulevard), caption, sub, size, titlepos.
// window.__shotReady is set once the scene has painted, so a screenshot
// script knows when to capture.

import { loadPhotoUrl, resizeSlots } from './photo-slots.js';
import { COVER_LAYOUTS, COVER_THEMES, EXPORT_SIZES } from './cover-painter.js';

const SAMPLES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

/**
 * Sets up a fixed screenshot scene.
 * `state` is the editor's cover state; `ui` carries the editor's refreshers.
 */
export async function runShotScene(shot, query, state, ui) {
  const layout = query.get('layout');
  if (layout && COVER_LAYOUTS[layout]) {
    state.layout = layout;
    state.slots = resizeSlots(state.slots, COVER_LAYOUTS[layout].panels);
    state.selectedPanel = 0;
  }
  const theme = query.get('theme');
  if (theme && COVER_THEMES[theme]) state.theme = theme;
  const size = query.get('size');
  if (size && EXPORT_SIZES.some((s) => s.id === size)) state.exportSize = size;
  const caption = query.get('caption');
  if (caption) state.title = caption;
  const sub = query.get('sub');
  if (sub !== null) state.subtitle = sub;
  const titlepos = query.get('titlepos');
  if (titlepos === 'top' || titlepos === 'bottom') state.titlePosition = titlepos;

  const photoName = query.get('photo') ?? 'pier';
  const first = await loadPhotoUrl(SAMPLES[photoName] ?? SAMPLES.pier);
  state.photos = [first];
  state.photoNames = [`${photoName}.jpg (sample)`];
  const secondName = query.get('photo2');
  if (secondName && SAMPLES[secondName]) {
    const second = await loadPhotoUrl(SAMPLES[secondName]);
    state.photos.push(second);
    state.photoNames.push(`${secondName}.jpg (sample)`);
    // Second photo fills the last panel when the layout has more than one.
    if (state.slots.length > 1) state.slots[state.slots.length - 1].photo = 1;
  }
  state.slots.forEach((slot) => {
    if (slot.photo >= state.photos.length) slot.photo = 0;
  });
  if (state.layout === 'trio-stripes') {
    // Filmstrip: each band shows a different slice of the same photo.
    const slices = [-0.28, 0, 0.28];
    state.slots.forEach((slot, i) => { slot.oy = slices[i] ?? 0; slot.zoom = 1.6; });
  }

  // Keep the caption inputs in sync with the scene's words.
  const titleInput = document.getElementById('titleInput');
  if (titleInput) titleInput.value = state.title;
  const subtitleInput = document.getElementById('subtitleInput');
  if (subtitleInput) subtitleInput.value = state.subtitle;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  document.querySelectorAll('.layout-pick').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout)));
  document.querySelectorAll('.theme-pick').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.theme === state.theme)));
  document.querySelectorAll('.size-pick').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.size === state.exportSize)));

  ui.buildPanelList();
  ui.buildPhotoStrip();
  ui.repaintPreview();
  ui.setStatus(`Scene ready: ${state.layout} · ${state.theme} · ${state.exportSize}`);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
