/* Two stacked frames. PhotoBase organises a library, it does not take
   pictures, so the mark is a stack rather than a shutter or a lens. */
const Mark = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    role="img"
    aria-label="PhotoBase"
    className={className}
  >
    <rect
      x="3.25"
      y="7.25"
      width="19.5"
      height="19.5"
      rx="5.25"
      stroke="var(--accent-2)"
      strokeWidth="1.5"
      opacity="0.45"
    />
    <rect x="9" y="5" width="20" height="20" rx="5.5" fill="var(--accent)" />
    <circle cx="15" cy="11.5" r="2" fill="var(--accent-ink)" opacity="0.9" />
    <path
      d="M11 21.5 L16.5 15.5 L20 19 L22.5 16.5 L27 21.5 Z"
      fill="var(--accent-ink)"
      opacity="0.9"
    />
  </svg>
);

export default Mark;
