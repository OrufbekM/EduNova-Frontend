import React from 'react'

/* =========================
   BASIC ICONS
   ========================= */

export const IconPlus = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const IconX = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export const IconCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const IconEdit = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

export const IconTrash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export const IconGrip = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
)

export const IconResize = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 17 20 12 15 7" />
    <polyline points="9 7 4 12 9 17" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
)

/* List type selector icons (Disc, 123, ABC) */
export const IconListDisc = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label="Bullet list">
    <circle cx="12" cy="8" r="2" />
    <circle cx="12" cy="14" r="2" />
    <circle cx="12" cy="20" r="2" />
  </svg>
)
export const IconList123 = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Numbered list">
    <path d="M10 6h11M10 12h11M10 18h11M4 6h1v0M4 12v-2h2v2l-1.5 2v2M5 18h1" />
  </svg>
)
export const IconListABC = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Letter list">
    <path d="M4 18V6l4 6 4-6v12M16 6v12M16 12h4" />
  </svg>
)

export const IconStar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 Q10 7 8 9 Q6 11 4 12 Q6 13 8 15 Q10 17 12 22 Q14 17 16 15 Q18 13 20 12 Q18 11 16 9 Q14 7 12 2 Z" />
  </svg>
)

/* =========================
   FILE & FOLDER ICONS
   ========================= */

export const IconFolder = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

export const IconFolderOpen = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M2 10h20" />
  </svg>
)

export const IconFile = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

export const IconAttachment = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

export const IconTable = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

export const IconType = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)

/* =========================
   NAVIGATION ICONS
   ========================= */

export const IconChevronDown = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const IconChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const IconArrowRight = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

/* AI / chatbot icon (from chatbot.svg) – used for ai-toggle and “Send to AI” button */
export const IconAiChat = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 500 500" fill="currentColor" style={{ display: 'block' }} aria-hidden="true">
    <g transform="translate(0,500) scale(0.1,-0.1)">
      <path d="M2295 4255 c-250 -29 -460 -93 -690 -210 -204 -104 -316 -185 -485 -355 -156 -155 -245 -271 -332 -432 l-53 -97 -50 -1 c-231 -2 -440 -156 -507 -374 -21 -68 -22 -87 -22 -476 0 -363 1 -411 18 -465 46 -151 138 -261 276 -331 74 -37 104 -45 200 -52 l85 -7 35 -67 c19 -37 46 -78 59 -92 48 -51 140 -46 196 10 54 54 50 92 -29 253 -80 166 -130 316 -157 473 -19 107 -21 149 -16 318 6 213 21 308 78 479 187 572 667 1001 1263 1129 108 23 144 26 331 26 182 0 225 -3 320 -23 586 -123 1040 -504 1253 -1051 75 -193 112 -388 112 -595 0 -287 -55 -512 -190 -780 -142 -282 -297 -444 -479 -502 -48 -16 -96 -18 -348 -18 l-292 0 -38 36 c-73 71 -85 74 -309 77 -224 4 -258 -1 -330 -52 -59 -40 -96 -106 -102 -179 -5 -64 23 -112 83 -142 38 -19 63 -20 590 -23 356 -2 589 1 660 8 190 19 336 82 481 208 128 111 200 206 298 398 l57 111 87 6 c226 13 417 167 473 380 17 63 19 113 19 466 0 448 -4 481 -70 592 -93 157 -286 267 -454 258 -35 -2 -52 1 -58 11 -4 8 -33 59 -63 114 -298 534 -854 896 -1490 971 -152 17 -259 17 -410 0z" />
      <path d="M1564 3240 c-103 -21 -212 -108 -262 -210 l-27 -55 0 -505 0 -505 29 -56 c57 -114 157 -189 277 -209 87 -14 1751 -14 1838 0 77 13 129 38 188 93 55 51 84 95 107 163 15 45 16 103 14 530 l-3 479 -32 65 c-41 83 -100 142 -182 183 l-66 32 -920 2 c-506 0 -939 -3 -961 -7z m354 -544 c86 -44 136 -128 136 -226 0 -85 -27 -145 -85 -191 -61 -49 -90 -59 -165 -59 -79 0 -120 16 -173 69 -54 54 -74 102 -74 181 -1 106 61 195 161 233 56 21 152 18 200 -7z m1372 3 c101 -45 150 -121 150 -229 0 -81 -14 -116 -69 -173 -55 -59 -98 -77 -181 -77 -81 0 -126 18 -176 72 -54 57 -69 95 -68 178 0 64 4 82 27 122 66 110 206 158 317 107z" />
    </g>
  </svg>
)

/* =========================
   MENU & UI ICONS
   ========================= */

export const IconMenu = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export const IconPanelLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
)

export const IconSettings = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

/* =========================
   AUTH ICONS
   ========================= */

export const IconMail = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13 2 6" />
  </svg>
)

export const IconUser = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)

export const IconLock = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const IconLogout = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const IconHome = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

/* =========================
   THEME ICONS
   ========================= */

export const SunIcon = ({ active, size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? 'var(--color-neon)' : 'var(--color-lightgray)'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: `${size}px`, height: `${size}px`, transition: 'all 0.3s ease' }}
  >
    <circle cx="12" cy="12" r="4" fill={active ? 'var(--color-neon)' : 'none'} />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
  </svg>
)

export const MoonIcon = ({ active, size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? 'var(--color-white)' : 'none'}
    stroke={active ? 'var(--color-white)' : 'var(--color-lightgray)'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: `${size}px`, height: `${size}px`, transition: 'all 0.3s ease' }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <path d="M17 4l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" strokeWidth="1.5" fill={active ? 'var(--color-white)' : 'none'} />
    <path d="M21 9l.3.6.6.3-.6.3-.3.6-.3-.6-.6-.3.6-.3z" strokeWidth="1.5" fill={active ? 'var(--color-white)' : 'none'} />
    <circle cx="19" cy="3" r="0.5" fill={active ? 'var(--color-white)' : 'var(--color-lightgray)'} />
  </svg>
)
