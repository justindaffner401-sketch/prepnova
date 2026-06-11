/**
 * Pure-SVG line chart of session scores over time (no chart dependency).
 * `results` must be sorted oldest → newest; shows the most recent 15.
 */
export default function ScoreChart({ results }) {
  const data = results.slice(-15);
  if (data.length === 0) return null;

  const W = 600;
  const H = 220;
  const pad = { top: 16, right: 18, bottom: 30, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const x = (i) =>
    pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (percent) => pad.top + (1 - percent / 100) * innerH;

  const linePoints = data.map((d, i) => `${x(i)},${y(d.percent)}`).join(" ");
  const areaPath =
    `M ${x(0)},${y(data[0].percent)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.percent)}`).join(" ") +
    ` L ${x(data.length - 1)},${pad.top + innerH} L ${x(0)},${pad.top + innerH} Z`;

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Score history chart"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="rgba(148,163,184,0.12)"
            strokeDasharray={tick === 0 ? "0" : "3 5"}
          />
          <text
            x={pad.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#64748b"
          >
            {tick}%
          </text>
        </g>
      ))}

      {data.length > 1 && <path d={areaPath} fill="url(#areaFill)" />}
      {data.length > 1 && (
        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {data.map((d, i) => (
        <circle
          key={d.id ?? i}
          cx={x(i)}
          cy={y(d.percent)}
          r={i === data.length - 1 ? 5 : 3.5}
          fill="#0a0f2e"
          stroke={i === data.length - 1 ? "#22d3ee" : "#3b82f6"}
          strokeWidth="2.5"
        >
          <title>{`${d.test} ${d.subject} — ${d.percent}% (${fmtDate(d.ts)})`}</title>
        </circle>
      ))}

      <text x={x(0)} y={H - 8} textAnchor="start" fontSize="11" fill="#64748b">
        {fmtDate(data[0].ts)}
      </text>
      {data.length > 1 && (
        <text
          x={x(data.length - 1)}
          y={H - 8}
          textAnchor="end"
          fontSize="11"
          fill="#64748b"
        >
          {fmtDate(data[data.length - 1].ts)}
        </text>
      )}
    </svg>
  );
}
