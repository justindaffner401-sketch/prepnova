// Minimal inline icon set (lucide-style strokes) — keeps the bundle free of
// an icon dependency.

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Icon({ className = "h-5 w-5", children }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
      {children}
    </svg>
  );
}

export function Bolt(props) {
  return (
    <Icon {...props}>
      <path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z" />
    </Icon>
  );
}

export function Clock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

export function Target(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Icon>
  );
}

export function TrendingUp(props) {
  return (
    <Icon {...props}>
      <path d="M22 7l-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </Icon>
  );
}

export function BookOpen(props) {
  return (
    <Icon {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </Icon>
  );
}

export function Sparkles(props) {
  return (
    <Icon {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7L19 15z" />
    </Icon>
  );
}

export function Check(props) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

export function XIcon(props) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Icon>
  );
}

export function ChevronRight(props) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function ArrowRight(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function PenLine(props) {
  return (
    <Icon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  );
}

export function Flask(props) {
  return (
    <Icon {...props}>
      <path d="M10 2v6.3L4.3 18.6A2 2 0 0 0 6 21.5h12a2 2 0 0 0 1.7-2.9L14 8.3V2" />
      <path d="M8.5 2h7" />
      <path d="M7.3 15h9.4" />
    </Icon>
  );
}

export function Sigma(props) {
  return (
    <Icon {...props}>
      <path d="M18 5H7l6 7-6 7h11" />
    </Icon>
  );
}

export function Trash(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

export function RotateCcw(props) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 2.9-6.6L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  );
}

export function AlertTriangle(props) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function KeyIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="7.5" cy="15.5" r="4" />
      <path d="m11 13 9-9" />
      <path d="m15 5 4 4" />
    </Icon>
  );
}

export function GraduationCap(props) {
  return (
    <Icon {...props}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </Icon>
  );
}

export function ChevronsUp(props) {
  return (
    <Icon {...props}>
      <path d="m17 11-5-5-5 5" />
      <path d="m17 18-5-5-5 5" />
    </Icon>
  );
}

export function Calculator(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h0M12 10h0M16 10h0M8 14h0M12 14h0M16 14h0M8 18h4" />
    </Icon>
  );
}
