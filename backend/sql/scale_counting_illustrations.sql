-- Единый размер предметов как у яблок (слот 84×80, диаметр ~48).
-- Usage: psql -U postgres -d alan -f scale_counting_illustrations.sql

BEGIN;

-- Яблоки (эталон, без изменений)
UPDATE exercises SET code = $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(126,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(210,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
</svg>
$svg$
WHERE id = 'count-apples';

UPDATE exercises SET code = $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(126,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(210,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(294,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(378,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
</svg>
$svg$
WHERE id = 'count-toothbrushes';

UPDATE exercises SET code = $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336 80" role="img" aria-hidden="true">
  <g transform="translate(42,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(126,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(210,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(294,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
</svg>
$svg$
WHERE id = 'count-pencils';

UPDATE exercises SET code = $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <circle cx="0" cy="26" r="24" fill="#FFFFFF" stroke="#FFEA00" stroke-width="3"/>
    <path d="M0 2 V50 M-24 26 H24" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
    <circle cx="0" cy="26" r="9" fill="none" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
  </g>
  <g transform="translate(126,14)">
    <circle cx="0" cy="26" r="24" fill="#FFFFFF" stroke="#FFEA00" stroke-width="3"/>
    <path d="M0 2 V50 M-24 26 H24" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
    <circle cx="0" cy="26" r="9" fill="none" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
  </g>
</svg>
$svg$
WHERE id = 'count-balls';

UPDATE exercises SET code = $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(126,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(210,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(294,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(378,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(462,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
</svg>
$svg$
WHERE id = 'count-stars';

COMMIT;
