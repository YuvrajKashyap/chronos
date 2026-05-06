export function ChronosLoginEmblem() {
  return (
    <svg
      className="chronos-login-mark"
      viewBox="0 0 240 240"
      role="img"
      aria-label="Chronos YK emblem"
    >
      <defs>
        <radialGradient id="chronosMarkFace" cx="44%" cy="34%" r="68%">
          <stop offset="0%" stopColor="var(--mark-face-hi)" />
          <stop offset="62%" stopColor="var(--mark-face)" />
          <stop offset="100%" stopColor="var(--mark-face-low)" />
        </radialGradient>
        <linearGradient id="chronosMarkGold" x1="18%" y1="9%" x2="86%" y2="92%">
          <stop offset="0%" stopColor="var(--mark-gold-hi)" />
          <stop offset="46%" stopColor="var(--mark-gold)" />
          <stop offset="100%" stopColor="var(--mark-gold-low)" />
        </linearGradient>
        <linearGradient id="chronosMarkSage" x1="20%" y1="8%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="var(--mark-sage-hi)" />
          <stop offset="58%" stopColor="var(--mark-sage)" />
          <stop offset="100%" stopColor="var(--mark-sage-low)" />
        </linearGradient>
        <linearGradient id="chronosMarkGlass" x1="70" y1="78" x2="109" y2="174">
          <stop offset="0%" stopColor="var(--mark-glass-hi)" />
          <stop offset="100%" stopColor="var(--mark-glass-low)" />
        </linearGradient>
        <filter id="chronosMarkLift" x="-24%" y="-24%" width="148%" height="152%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="var(--mark-shadow)" floodOpacity="0.22" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodColor="var(--mark-gold-low)" floodOpacity="0.42" />
        </filter>
        <filter id="chronosMarkInset" x="-16%" y="-16%" width="132%" height="132%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.55" floodColor="var(--mark-gold-hi)" floodOpacity="0.85" />
          <feDropShadow dx="0" dy="-1" stdDeviation="0.6" floodColor="var(--mark-shadow)" floodOpacity="0.18" />
        </filter>
      </defs>

      <circle className="mark-aura" cx="120" cy="120" r="113" />
      <circle className="mark-face" cx="120" cy="120" r="106" />
      <circle className="mark-rim mark-rim-outer" cx="120" cy="120" r="108" />
      <circle className="mark-rim mark-rim-highlight" cx="120" cy="120" r="101" />
      <circle className="mark-rim mark-rim-inner" cx="120" cy="120" r="78" />

      <g className="mark-ticks" aria-hidden="true">
        <path d="M120 22v18" />
        <path d="M120 200v18" />
        <path d="M22 120h18" />
        <path d="M200 120h18" />
        <path d="M70.5 34.3l8.7 15" />
        <path d="M160.8 190.7l8.7 15" />
        <path d="M34.3 169.5l15-8.7" />
        <path d="M190.7 79.2l15-8.7" />
      </g>

      <g className="mark-roman" aria-hidden="true">
        <text x="120" y="36" textAnchor="middle">XII</text>
        <text x="35" y="127" textAnchor="middle">IX</text>
        <text x="205" y="127" textAnchor="middle">III</text>
        <text x="120" y="214" textAnchor="middle">VI</text>
      </g>

      <g className="mark-sage-lines" aria-hidden="true">
        <path d="M127 156c29 2 43-20 57-16 16 5 17 28 38 24" />
        <path d="M129 167c31 3 50-18 66-11 13 6 14 22 30 21" />
        <path d="M132 178c35 4 56-14 72-5 8 5 12 12 22 12" />
      </g>

      <g className="mark-dots" aria-hidden="true">
        <circle cx="170" cy="84" r="1.2" />
        <circle cx="180" cy="88" r="1.1" />
        <circle cx="188" cy="94" r="1" />
        <circle cx="174" cy="100" r="1.3" />
        <circle cx="187" cy="107" r="1" />
        <circle cx="197" cy="114" r="0.9" />
      </g>

      <g className="mark-hourglass" transform="translate(-20 0)" aria-hidden="true">
        <path
          className="mark-hourglass-glass"
          d="M80 76c7 7 13 17 13 31 0 13-8 21-13 28 6 8 13 17 13 31 0 8-2 15-6 21h33c-4-6-6-13-6-21 0-14 7-23 13-31-5-7-13-15-13-28 0-14 6-24 13-31H80Z"
        />
        <path className="mark-hourglass-line" d="M80 76h47M80 187h47M94 105c5 8 13 9 20 0M93 167c9-8 17-8 25 0" />
        <path className="mark-sand mark-sand-top" d="M94 93h20c-2 10-5 17-10 21-5-4-8-11-10-21Z" />
        <path className="mark-sand mark-sand-bottom" d="M93 174c7-9 15-9 24 0v7H93v-7Z" />
      </g>

      <g className="mark-monogram" filter="url(#chronosMarkLift)" aria-hidden="true">
        <text className="mark-letter mark-letter-back" x="119" y="166" textAnchor="middle">YK</text>
        <text className="mark-letter mark-letter-front" x="119" y="166" textAnchor="middle">YK</text>
      </g>
    </svg>
  );
}
