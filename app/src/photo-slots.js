// Photo slots: which uploaded photo fills each panel, and how it is cropped.
// A slot holds a photo index (-1 = no photo, show the sunset scene), a zoom
// factor and a pan offset in fractions of the panel size. Dragging the
// preview pans the selected panel; the zoom slider scales it.

export const MAX_PHOTOS = 3;
export const MAX_PANELS = 4;

/** A fresh slot list for a layout with `count` panels. */
export function freshSlots(count) {
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    slots.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  }
  return slots;
}

/** Grow or shrink the slot list when the layout changes, keeping old values. */
export function resizeSlots(slots, count) {
  const next = slots.slice(0, count);
  while (next.length < count) next.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  return next;
}

/** Clamps a pan offset so the photo can never be dragged out of its panel. */
export function clampPan(slot) {
  const limit = 0.45;
  slot.ox = Math.max(-limit, Math.min(limit, slot.ox));
  slot.oy = Math.max(-limit, Math.min(limit, slot.oy));
  return slot;
}

/** Clamps the zoom slider range. */
export function clampZoom(zoom) {
  return Math.max(1, Math.min(3, zoom));
}

/** Loads an image file from the user's machine; it never leaves the browser. */
export function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image file.')); };
    img.src = url;
  });
}

/** Loads a bundled sample photo by URL (used by the fixed ?shot= scenes). */
export function loadPhotoUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}
