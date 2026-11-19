// Vice City Cover Studio — the cover painter.
//
// Draws a GTA-style multi-panel cover on any canvas: a hand-drawn sunset
// sky (gradient sky, glowing sun, palm-tree and skyline silhouettes), photo
// panels with a warm or neon colour grade, and bold gradient title lettering
// with an outline and glow. Everything is drawn with canvas paths — no
// Rockstar artwork, logo or font is used anywhere.

export const COVER_LAYOUTS = {
  hero: { label: 'Hero — one big photo', panels: 1 },
  'hero-duo': { label: 'Hero + two — one big, two small', panels: 3 },
  'trio-stripes': { label: 'Trio stripes — three bands', panels: 3 },
  'quad-grid': { label: 'Quad grid — four panels', panels: 4 },
};

export const COVER_THEMES = {
  sunset: {
    label: 'Sunset — orange pink',
    skyTop: '#2b1055', skyMid: '#e13a7a', skyLow: '#ff7e3d', sun: '#ffd76a',
    sunGlow: 'rgba(255, 150, 60, 0.55)', silhouette: '#1c0b33',
    gradeTop: 'rgba(255, 120, 40, 0.42)', gradeBottom: 'rgba(224, 40, 120, 0.44)',
    titleTop: '#fff3b0', titleBottom: '#ff7a2f', titleOutline: '#2b0a3d',
    titleGlow: 'rgba(255, 110, 40, 0.85)', scrim: 'rgba(28, 8, 46, 0.72)',
    frame: '#ffd76a', gutter: '#160a26',
  },
  neon: {
    label: 'Neon — purple cyan',
    skyTop: '#0a0626', skyMid: '#6d28d9', skyLow: '#06b6d4', sun: '#f0abfc',
    sunGlow: 'rgba(168, 85, 247, 0.6)', silhouette: '#0d0524',
    gradeTop: 'rgba(120, 60, 255, 0.44)', gradeBottom: 'rgba(0, 220, 255, 0.42)',
    titleTop: '#e0f2fe', titleBottom: '#22d3ee', titleOutline: '#12042e',
    titleGlow: 'rgba(34, 211, 238, 0.9)', scrim: 'rgba(10, 4, 38, 0.75)',
    frame: '#22d3ee', gutter: '#0a0626',
  },
  midnight: {
    label: 'Midnight gold',
    skyTop: '#050914', skyMid: '#1e2a5a', skyLow: '#c98a2b', sun: '#ffe9a8',
    sunGlow: 'rgba(255, 190, 80, 0.5)', silhouette: '#060a18',
    gradeTop: 'rgba(201, 138, 43, 0.40)', gradeBottom: 'rgba(10, 20, 60, 0.46)',
    titleTop: '#fff8dc', titleBottom: '#e9b949', titleOutline: '#0a0f1e',
    titleGlow: 'rgba(233, 185, 73, 0.85)', scrim: 'rgba(5, 9, 20, 0.78)',
    frame: '#e9b949', gutter: '#050914',
  },
};

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** Panel rectangles for a layout, in cover coordinates. Gutter is in pixels. */
export function layoutPanels(layoutId, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012); // gutter between panels
  const full = { x: 0, y: 0, w, h };
  switch (layoutId) {
    case 'hero-duo': {
      const bigW = Math.round(w * 0.66);
      const smallW = w - bigW - g;
      const smallH = Math.round((h - g) / 2);
      return [
        { x: 0, y: 0, w: bigW, h },
        { x: bigW + g, y: 0, w: smallW, h: smallH },
        { x: bigW + g, y: smallH + g, w: smallW, h: h - smallH - g },
      ];
    }
    case 'trio-stripes': {
      const bandH = Math.round((h - 2 * g) / 3);
      return [
        { x: 0, y: 0, w, h: bandH },
        { x: 0, y: bandH + g, w, h: bandH },
        { x: 0, y: 2 * (bandH + g), w, h: h - 2 * (bandH + g) },
      ];
    }
    case 'quad-grid': {
      const halfW = Math.round((w - g) / 2);
      const halfH = Math.round((h - g) / 2);
      return [
        { x: 0, y: 0, w: halfW, h: halfH },
        { x: halfW + g, y: 0, w: w - halfW - g, h: halfH },
        { x: 0, y: halfH + g, w: halfW, h: h - halfH - g },
        { x: halfW + g, y: halfH + g, w: w - halfW - g, h: h - halfH - g },
      ];
    }
    case 'hero':
    default:
      return [full];
  }
}

/** Paints the hand-drawn sunset backdrop: sky gradient, glowing sun, skyline and palms. */
export function paintSunsetBackdrop(ctx, w, h, theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun with a soft halo, sitting just above the horizon line.
  const sunX = w * 0.68;
  const sunY = h * 0.62;
  const sunR = Math.min(w, h) * 0.11;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  halo.addColorStop(0, theme.sunGlow);
  halo.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Thin horizontal light streaks across the low sky.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  for (let i = 0; i < 4; i += 1) {
    const y = h * (0.52 + i * 0.05);
    ctx.fillRect(0, y, w, Math.max(2, h * 0.004));
  }

  paintSkyline(ctx, w, h, theme);
  paintPalmRow(ctx, w, h, theme);
}

/** Dark building silhouettes along the horizon, with a few lit windows. */
export function paintSkyline(ctx, w, h, theme) {
  const base = h * 0.86;
  ctx.fillStyle = theme.silhouette;
  let x = -w * 0.02;
  let seed = 7;
  const next = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.05 + next() * 0.07);
    const bh = h * (0.06 + next() * 0.12);
    ctx.fillRect(x, base - bh, bw, bh + h * 0.14);
    if (next() > 0.6) { // rooftop antenna
      ctx.fillRect(x + bw / 2 - 1, base - bh - h * 0.03, 2, h * 0.03);
    }
    if (next() > 0.5) { // a few lit windows
      ctx.fillStyle = theme.sun;
      for (let wy = 0; wy < 3; wy += 1) {
        if (next() > 0.55) ctx.fillRect(x + bw * 0.2, base - bh + h * 0.02 + wy * h * 0.03, bw * 0.14, h * 0.014);
      }
      ctx.fillStyle = theme.silhouette;
    }
    x += bw + w * 0.008;
  }
}

/** A row of palm-tree silhouettes in front of the skyline. */
export function paintPalmRow(ctx, w, h, theme) {
  ctx.fillStyle = theme.silhouette;
  ctx.strokeStyle = theme.silhouette;
  const ground = h * 0.98;
  const spots = [0.06, 0.2, 0.38, 0.55, 0.8, 0.93];
  for (const fx of spots) {
    const px = w * fx;
    const size = Math.min(w, h) * (0.09 + (fx % 0.3) * 0.2);
    paintPalm(ctx, px, ground, size);
  }
}

/** One palm tree: a leaning trunk and seven drooping fronds, all paths. */
export function paintPalm(ctx, x, groundY, size) {
  const topY = groundY - size;
  const lean = size * 0.12;
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + lean * 0.4, groundY - size * 0.55, x + lean, topY);
  ctx.stroke();
  const crownX = x + lean;
  const crownY = topY;
  for (let i = 0; i < 7; i += 1) {
    const angle = (-Math.PI * 0.95) + (i * Math.PI * 0.32);
    const len = size * (0.42 + (i % 2) * 0.1);
    const tipX = crownX + Math.cos(angle) * len;
    const tipY = crownY + Math.sin(angle) * len * 0.7 + size * 0.22;
    ctx.lineWidth = Math.max(2, size * 0.03);
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * len * 0.55,
      crownY + Math.sin(angle) * len * 0.4 - size * 0.08,
      tipX, tipY,
    );
    ctx.stroke();
  }
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(crownX, crownY, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws one photo into a panel, cover-fit, with pan and zoom from the slot. */
export function paintPhotoPanel(ctx, img, rect, slot, theme) {
  if (!img) return false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const zoom = slot?.zoom ?? 1;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (slot?.ox ?? 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (slot?.oy ?? 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
  // Warm / neon colour grade: a soft-light tint plus a multiply vignette.
  const grade = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grade.addColorStop(0, theme.gradeTop);
  grade.addColorStop(1, theme.gradeBottom);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'multiply';
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(20, 5, 30, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  return true;
}

/** Bold gradient title with outline and glow, plus the subtitle line. */
export function paintTitleBlock(ctx, w, h, theme, title, subtitle, sizeScale, position) {
  const unit = Math.min(w, h) / 1000;
  let titlePx = Math.max(28, Math.round(92 * unit * sizeScale));
  const subPx = Math.max(14, Math.round(30 * unit));
  // Shrink the title until it fits the cover width, so long captions never clip.
  const titleFont = (px) => `900 ${px}px 'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
  const maxTitleW = w * 0.94;
  ctx.font = titleFont(titlePx);
  while (titlePx > 28 && ctx.measureText(title.toUpperCase()).width > maxTitleW) {
    titlePx = Math.round(titlePx * 0.94);
    ctx.font = titleFont(titlePx);
  }
  const bottom = position === 'top';
  const bandH = titlePx * 1.15 + subPx * 2.1;
  const bandY = bottom ? 0 : h - bandH;
  // Scrim so the letters stay readable over any photo.
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (bottom) {
    scrim.addColorStop(0, theme.scrim);
    scrim.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, theme.scrim);
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, w, bandH);

  const cx = w / 2;
  const titleY = bottom
    ? bandY + titlePx * 0.95
    : h - subPx * 1.7 - titlePx * 0.12;
  const subY = bottom
    ? bandY + titlePx * 1.05 + subPx * 1.1
    : h - subPx * 0.55;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY);
  grad.addColorStop(0, theme.titleTop);
  grad.addColorStop(1, theme.titleBottom);
  ctx.font = titleFont(titlePx);
  try { ctx.letterSpacing = `${Math.round(titlePx * 0.04)}px`; } catch { /* older canvas: no letter spacing */ }
  ctx.shadowColor = theme.titleGlow;
  ctx.shadowBlur = titlePx * 0.28;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, titlePx * 0.09);
  ctx.strokeStyle = theme.titleOutline;
  ctx.strokeText(title.toUpperCase(), cx, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(title.toUpperCase(), cx, titleY);
  ctx.shadowBlur = 0;

  if (subtitle) {
    ctx.font = `700 ${subPx}px 'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subPx * 0.22)}px`; } catch { /* older canvas */ }
    ctx.lineWidth = Math.max(3, subPx * 0.16);
    ctx.strokeStyle = theme.titleOutline;
    ctx.strokeText(subtitle.toUpperCase(), cx, subY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle.toUpperCase(), cx, subY);
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

/**
 * Paints the whole cover. `cover` describes the art:
 * { layout, theme, title, subtitle, titleSize, titlePosition,
 *   photos: HTMLImageElement[], slots: [{photo, zoom, ox, oy}] }
 * A slot with photo -1 (or no photo) shows the sunset backdrop instead.
 */
export function paintCover(canvas, cover) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const theme = COVER_THEMES[cover.theme] ?? COVER_THEMES.sunset;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = theme.gutter;
  ctx.fillRect(0, 0, w, h);

  paintSunsetBackdrop(ctx, w, h, theme);

  const rects = layoutPanels(cover.layout, w, h);
  rects.forEach((rect, i) => {
    const slot = cover.slots?.[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = slot.photo >= 0 ? cover.photos?.[slot.photo] ?? null : null;
    const painted = paintPhotoPanel(ctx, img, rect, slot, theme);
    if (!painted) {
      // No photo in this panel: keep the sunset scene, framed like a panel.
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      ctx.restore();
    }
    ctx.strokeStyle = theme.frame;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.003);
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.globalAlpha = 1;
  });

  // Outer frame.
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.006);
  ctx.strokeRect(2, 2, w - 4, h - 4);

  paintTitleBlock(ctx, w, h, theme, cover.title || 'VICE CITY', cover.subtitle || '',
    cover.titleSize ?? 1, cover.titlePosition ?? 'bottom');
  return canvas;
}
