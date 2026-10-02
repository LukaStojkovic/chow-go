import { cn } from "@/lib/utils";

function UnitedKingdom() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="size-full">
      <clipPath id="flag-gb-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function Serbia() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" className="size-full">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height="0.6667" fill="#C6363C" />
      <rect y="0.6667" width="3" height="0.6667" fill="#0C4076" />
    </svg>
  );
}

const FLAGS = {
  en: UnitedKingdom,
  sr: Serbia,
};

export function FlagIcon({ code, className }) {
  const Flag = FLAGS[code];
  if (!Flag) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-border/60",
        className,
      )}
    >
      <Flag />
    </span>
  );
}
