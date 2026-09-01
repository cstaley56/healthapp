// Small stroke-based icon set for the History tab redesign. Kept as plain
// inline SVG (no icon library dependency) so nothing new needs installing.

type IconProps = { className?: string };

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="9" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="13" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 17 17" fill="none" className={className}>
      <path
        d="M3 5h11M7 5V3.3A1 1 0 0 1 8 2.3h1A1 1 0 0 1 10 3.3V5M4.5 5l.6 8.4A1.5 1.5 0 0 0 6.6 15h3.8a1.5 1.5 0 0 0 1.5-1.6L12.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M2.5 6.2l2.6 2.6L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 10.2l2.3 2.3L14 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WaterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2.5C10 2.5 4.5 9.2 4.5 13A5.5 5.5 0 0 0 10 18.5A5.5 5.5 0 0 0 15.5 13C15.5 9.2 10 2.5 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 17C10 17 3 12.4 3 7.6C3 5 5 3 7.4 3C8.9 3 10 4 10 4C10 4 11.1 3 12.6 3C15 3 17 5 17 7.6C17 12.4 10 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PulseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M2 10h3l1.5-4L9 15l2-9 1.5 4H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4" y="2.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7h6M7 10.2h6M7 13.4h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
