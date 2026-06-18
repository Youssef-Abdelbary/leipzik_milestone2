/* eslint-disable react-refresh/only-export-components */
// ─── Opal Design Token Palette ────────────────────────────────────────────────
// This file intentionally mixes component + non-component exports (tokens,
// icons, helpers). The react-refresh rule is disabled here by design — theme
// files are a recognised exception to the single-export-type rule.
// Drop-in replacement for utils/theme.jsx — maps P.xxx to opal CSS variables.
// Blue → violet, green → teal, keeping all existing P keys for compatibility.

export const P = {
  // Surfaces
  bg:          '#0a0a12',
  surface:     '#13131e',
  panel:       '#0f0f19',
  hover:       '#1e1e2e',
  hoverStrong: '#252535',

  // Borders
  border:      'rgba(255,255,255,0.08)',
  borderSub:   'rgba(255,255,255,0.04)',
  borderFocus: 'rgba(255,255,255,0.18)',

  // Text
  text:        '#ede9ff',
  sub:         'rgba(237,233,255,0.52)',
  muted:       'rgba(237,233,255,0.28)',

  // Violet — primary action
  blue:        '#8b6dff',
  blueGlow:    'rgba(139,109,255,0.16)',
  blueDeep:    '#6b4fe0',

  // Teal — success / confirmed
  green:       '#3ecfb8',
  greenGlow:   'rgba(62,207,184,0.14)',
  teal:        '#3ecfb8',
  tealGlow:    'rgba(62,207,184,0.14)',

  // Rose — destructive / declined
  red:         '#f4607a',
  redGlow:     'rgba(244,96,122,0.14)',

  // Amber — warning / reminder
  amber:       '#f5a623',
  amberGlow:   'rgba(245,166,35,0.14)',

  // Purple — planning / distinct from violet
  purple:      '#c084fc',
  purpleGlow:  'rgba(192,132,252,0.14)',

  // Rose / pink — follow-up / accent
  rose:        '#fb7185',
  roseGlow:    'rgba(251,113,133,0.14)',

  // Orange — update / warm accent
  orange:      '#fb923c',
  orangeGlow:  'rgba(251,146,60,0.14)',

  // Indigo — cool accent
  indigo:      '#818cf8',
  indigoGlow:  'rgba(129,140,248,0.14)',

  // Cyan — info
  cyan:        '#22d3ee',
  cyanGlow:    'rgba(34,211,238,0.12)',
};

// ─── Status helpers ───────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  draft:     P.muted,
  planning:  P.indigo,
  confirmed: P.teal,
  completed: P.purple,
  cancelled: P.rose,
};

export const STATUS_OPTIONS = ['planning', 'confirmed', 'completed', 'cancelled'];

// ─── SVG icon factory (Lucide-style) ─────────────────────────────────────────
const ic = (path, extra = '') => (
  <svg
    width="20" height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
    aria-hidden="true"
  >
    {path}
    {extra}
  </svg>
);

// ─── Icons — all icons from utils/theme.jsx ───────────────────────────────────
export const icons = {
  // Tabs
  overview: ic(
    <><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></>
  ),
  guests: ic(
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
  ),
  dayof: ic(
    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>
  ),
  messages: ic(
    <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>
  ),
  feedback: ic(
    <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>
  ),
  venue: ic(
    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
  ),
  vendors: ic(
    <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>
  ),
  budget: ic(
    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>
  ),
  team: ic(
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
  ),
  barChart: ic(
    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
  ),

  // UI chrome
  settings: ic(
    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>
  ),
  back: ic(<><polyline points="15 18 9 12 15 6"/></>),
  calendar: ic(
    <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
  ),
  refresh: ic(
    <><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></>
  ),
  plus: ic(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  mail: ic(
    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
  ),
  check: ic(<><polyline points="20 6 9 17 4 12"/></>),
  edit: ic(
    <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
  ),
  trash: ic(
    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>
  ),
  search: ic(
    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>
  ),
  filter: ic(
    <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>
  ),
  chevronDown: ic(<><polyline points="6 9 12 15 18 9"/></>),
  x: ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  star: ic(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>),
  zap: ic(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>),
  send: ic(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
  users: ic(
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
  ),
  qr: ic(
    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/><line x1="14" y1="14" x2="17" y2="14"/><line x1="17" y1="14" x2="17" y2="17"/><line x1="17" y1="17" x2="21" y2="17"/><line x1="21" y1="14" x2="21" y2="17"/></>
  ),
  warning: ic(
    <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
  ),
  info: ic(
    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>
  ),
  ticket: ic(
    <><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="12" x2="9.01" y2="12" strokeWidth="2"/><line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="2"/><line x1="15" y1="12" x2="15.01" y2="12" strokeWidth="2"/></>
  ),
  clock: ic(
    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
  ),
  mapPin: ic(
    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>
  ),
  tag: ic(
    <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>
  ),
  printer: ic(
    <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>
  ),
  camera: ic(
    <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>
  ),
  keyboard: ic(
    <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></>
  ),
  bell: ic(
    <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>
  ),
  megaphone: ic(
    <><path d="M3 11l19-9v18L3 13"/><path d="M11 13v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/></>
  ),
  clipboard: ic(
    <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></>
  ),
  frown: ic(
    <><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>
  ),
  sparkles: ic(
    <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 1l.75 2.25L22 4l-2.25.75L19 7l-.75-2.25L16 4l2.25-.75L19 1z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/></>
  ),
  wrench: ic(
    <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>
  ),
  utensils: ic(
    <><line x1="3" y1="2" x2="3" y2="12"/><line x1="7" y1="2" x2="7" y2="12"/><path d="M3 12a4 4 0 0 0 4 4v6"/><path d="M21 2v18a2 2 0 0 1-2 2h-.5a1.5 1.5 0 0 1-1.5-1.5V12a4 4 0 0 0-4-4V2"/></>
  ),
  building2: ic(
    <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><line x1="10" y1="6" x2="10" y2="6.01"/><line x1="14" y1="6" x2="14" y2="6.01"/><line x1="10" y1="10" x2="10" y2="10.01"/><line x1="14" y1="10" x2="14" y2="14.01"/><line x1="10" y1="14" x2="10" y2="14.01"/><line x1="14" y1="14" x2="14" y2="14.01"/><line x1="10" y1="18" x2="14" y2="18"/></>
  ),
  arrowRight: ic(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>),
  checkCircle: ic(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  xCircle: ic(<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>),
  chevronUp: ic(<><polyline points="18 15 12 9 6 15"/></>),
  videoOff: ic(<><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><path d="M23 7l-7 5 7 5V7z"/><line x1="1" y1="1" x2="23" y2="23"/></>),
  shieldOff: ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v4.09c0 5.52 3.44 10.08 8 11.91z"/><line x1="9" y1="9" x2="15" y2="15"/></>),
};

// ─── Parametric star (for rating components) ──────────────────────────────────
export const icStar = (size = 20, filled = false) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ─── GlassPanel — reusable glass-morphism card ────────────────────────────────
export function GlassPanel({ children, style = {}, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: 'rgba(30,30,41,0.55)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
