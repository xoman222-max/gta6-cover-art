// Vice City Cover Studio — the editor.
//
// Wires the controls to the cover painter: uploading photos, picking a
// layout and theme, editing the caption, dragging a panel's photo to position
// it, and exporting the cover as a PNG in the three post sizes. Photos are
// read with FileReader / object URLs on this machine and never uploaded.

import { paintCover, layoutPanels, COVER_LAYOUTS, COVER_THEMES, EXPORT_SIZES } from './cover-painter.js';
import { freshSlots, resizeSlots, clampPan, clampZoom, loadPhotoFile, loadPhotoUrl, MAX_PHOTOS } from './photo-slots.js';
import { runShotScene } from './shot-scenes.js';

const $ = (id) => document.getElementById(id);
const preview = $('coverPreview');
const statusEl = $('exportStatus');

export const coverState = {
  layout: 'hero-duo',
  theme: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'WELCOME BACK TO VICE CITY',
  titleSize: 1,
  titlePosition: 'bottom',
  exportSize: '1920x1080',
  photos: [], // HTMLImageElement[], up to MAX_PHOTOS
  photoNames: [],
  slots: freshSlots(3),
  selectedPanel: 0,
};

export function repaintPreview() {
  const size = EXPORT_SIZES.find((s) => s.id === coverState.exportSize) ?? EXPORT_SIZES[2];
  if (preview.width !== size.w || preview.height !== size.h) {
    preview.width = size.w;
    preview.height = size.h;
  }
  paintCover(preview, coverState);
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Builds the layout picker buttons from COVER_LAYOUTS. */
function buildLayoutPicker() {
  const box = $('layoutPicker');
  Object.entries(COVER_LAYOUTS).forEach(([id, layout]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick layout-pick';
    button.dataset.layout = id;
    button.textContent = layout.label;
    button.setAttribute('aria-pressed', String(id === coverState.layout));
    button.addEventListener('click', () => {
      coverState.layout = id;
      coverState.slots = resizeSlots(coverState.slots, layout.panels);
      coverState.selectedPanel = 0;
      document.querySelectorAll('.layout-pick').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.layout === id)));
      buildPanelList();
      repaintPreview();
    });
    box.appendChild(button);
  });
}

/** Builds the theme picker buttons from COVER_THEMES. */
function buildThemePicker() {
  const box = $('themePicker');
  Object.entries(COVER_THEMES).forEach(([id, theme]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick theme-pick';
    button.dataset.theme = id;
    button.textContent = theme.label;
    button.setAttribute('aria-pressed', String(id === coverState.theme));
    button.addEventListener('click', () => {
      coverState.theme = id;
      document.querySelectorAll('.theme-pick').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.theme === id)));
      repaintPreview();
    });
    box.appendChild(button);
  });
}

/** Builds the export-size picker buttons from EXPORT_SIZES. */
function buildSizePicker() {
  const box = $('sizePicker');
  EXPORT_SIZES.forEach((size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick size-pick';
    button.dataset.size = size.id;
    button.textContent = size.label;
    button.setAttribute('aria-pressed', String(size.id === coverState.exportSize));
    button.addEventListener('click', () => {
      coverState.exportSize = size.id;
      document.querySelectorAll('.size-pick').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.size === size.id)));
      repaintPreview();
    });
    box.appendChild(button);
  });
}

/** One row per panel: which photo it shows, zoom slider, and a select button. */
function buildPanelList() {
  const list = $('panelList');
  list.innerHTML = '';
  const rects = layoutPanels(coverState.layout, preview.width, preview.height);
  rects.forEach((rect, i) => {
    const slot = coverState.slots[i];
    const row = document.createElement('div');
    row.className = 'panel-row';
    if (i === coverState.selectedPanel) row.classList.add('selected');

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'panel-name';
    pick.textContent = `Panel ${i + 1}`;
    pick.addEventListener('click', () => {
      coverState.selectedPanel = i;
      buildPanelList();
      repaintPreview();
    });

    const photoSelect = document.createElement('select');
    photoSelect.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const sunsetOption = document.createElement('option');
    sunsetOption.value = '-1';
    sunsetOption.textContent = 'Sunset scene';
    photoSelect.appendChild(sunsetOption);
    coverState.photos.forEach((img, p) => {
      const option = document.createElement('option');
      option.value = String(p);
      option.textContent = `Photo ${p + 1} — ${coverState.photoNames[p] ?? ''}`;
      photoSelect.appendChild(option);
    });
    photoSelect.value = String(slot.photo);
    photoSelect.addEventListener('change', () => {
      slot.photo = Number(photoSelect.value);
      repaintPreview();
    });

    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.05';
    zoom.value = String(slot.zoom);
    zoom.setAttribute('aria-label', `Zoom for panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      slot.zoom = clampZoom(Number(zoom.value));
      repaintPreview();
    });

    row.append(pick, photoSelect, zoom);
    list.appendChild(row);
  });
}

/** Refreshes the photo thumbnail strip after an upload. */
function buildPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  coverState.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = `Uploaded photo ${i + 1}`;
    thumb.src = img.src;
    thumb.title = coverState.photoNames[i] ?? `Photo ${i + 1}`;
    strip.appendChild(thumb);
  });
  const hint = document.createElement('span');
  hint.className = 'photo-count';
  hint.textContent = coverState.photos.length === 0
    ? 'No photos yet — add one below, or try a sample.'
    : `${coverState.photos.length} of ${MAX_PHOTOS} photos`;
  strip.appendChild(hint);
}

async function addPhotoFiles(files) {
  for (const file of files) {
    if (coverState.photos.length >= MAX_PHOTOS) {
      setStatus(`Only ${MAX_PHOTOS} photos at a time — remove one first.`);
      break;
    }
    try {
      const img = await loadPhotoFile(file);
      coverState.photos.push(img);
      coverState.photoNames.push(file.name);
    } catch {
      setStatus('That file could not be read as an image.');
    }
  }
  // Any panel still pointing at a missing photo falls back to photo 1.
  coverState.slots.forEach((slot) => {
    if (slot.photo >= coverState.photos.length) slot.photo = coverState.photos.length ? 0 : -1;
  });
  buildPhotoStrip();
  buildPanelList();
  repaintPreview();
}

/** Dragging the preview pans the selected panel's photo. */
function wirePreviewDrag() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const toCanvas = (event) => {
    const box = preview.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * preview.width,
      y: ((event.clientY - box.top) / box.height) * preview.height,
    };
  };
  preview.addEventListener('pointerdown', (event) => {
    const point = toCanvas(event);
    const rects = layoutPanels(coverState.layout, preview.width, preview.height);
    const hit = rects.findIndex((r) =>
      point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
    if (hit >= 0) {
      coverState.selectedPanel = hit;
      buildPanelList();
    }
    dragging = true;
    lastX = point.x;
    lastY = point.y;
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const point = toCanvas(event);
    const slot = coverState.slots[coverState.selectedPanel];
    if (!slot) return;
    const rects = layoutPanels(coverState.layout, preview.width, preview.height);
    const rect = rects[coverState.selectedPanel];
    slot.ox += (point.x - lastX) / rect.w;
    slot.oy += (point.y - lastY) / rect.h;
    clampPan(slot);
    lastX = point.x;
    lastY = point.y;
    repaintPreview();
  });
  const stop = () => { dragging = false; };
  preview.addEventListener('pointerup', stop);
  preview.addEventListener('pointercancel', stop);
}

/** Exports the cover at the chosen size and downloads it as a PNG. */
export function exportCoverPng() {
  const size = EXPORT_SIZES.find((s) => s.id === coverState.exportSize) ?? EXPORT_SIZES[2];
  const started = performance.now();
  const offscreen = document.createElement('canvas');
  offscreen.width = size.w;
  offscreen.height = size.h;
  paintCover(offscreen, coverState);
  offscreen.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — please try again.'); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-city-cover-${size.w}x${size.h}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    const ms = Math.round(performance.now() - started);
    setStatus(`Exported ${size.w} x ${size.h} PNG in ${ms} ms — saved as vice-city-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

function wireControls() {
  $('photoInput').addEventListener('change', (event) => {
    addPhotoFiles([...event.target.files]);
    event.target.value = '';
  });
  $('samplePier').addEventListener('click', async () => {
    const img = await loadPhotoUrl('samples/pier.jpg');
    coverState.photos = [img];
    coverState.photoNames = ['pier.jpg (sample)'];
    coverState.slots.forEach((slot) => { slot.photo = 0; });
    buildPhotoStrip();
    buildPanelList();
    repaintPreview();
  });
  $('sampleBoulevard').addEventListener('click', async () => {
    const img = await loadPhotoUrl('samples/boulevard.jpg');
    coverState.photos = [img];
    coverState.photoNames = ['boulevard.jpg (sample)'];
    coverState.slots.forEach((slot) => { slot.photo = 0; });
    buildPhotoStrip();
    buildPanelList();
    repaintPreview();
  });
  $('titleInput').addEventListener('input', (event) => {
    coverState.title = event.target.value;
    repaintPreview();
  });
  $('subtitleInput').addEventListener('input', (event) => {
    coverState.subtitle = event.target.value;
    repaintPreview();
  });
  $('titleSize').addEventListener('input', (event) => {
    coverState.titleSize = Number(event.target.value);
    repaintPreview();
  });
  $('titlePosition').addEventListener('change', (event) => {
    coverState.titlePosition = event.target.value;
    repaintPreview();
  });
  $('exportButton').addEventListener('click', exportCoverPng);
  wirePreviewDrag();
}

buildLayoutPicker();
buildThemePicker();
buildSizePicker();
buildPanelList();
buildPhotoStrip();
wireControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShotScene(shot, new URLSearchParams(location.search), coverState, {
    repaintPreview, buildPanelList, buildPhotoStrip, setStatus,
  });
} else {
  repaintPreview();
}
