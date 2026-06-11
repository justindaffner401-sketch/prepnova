import { ChevronsUp } from "./icons.jsx";

export default function Logo({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-electric-500 to-cyan-400 shadow-[0_4px_18px_rgba(59,130,246,0.45)]">
        <ChevronsUp className="h-5 w-5 text-white" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-white">
          Prep<span className="text-gradient">Nova</span>
        </span>
      )}
    </span>
  );
}
