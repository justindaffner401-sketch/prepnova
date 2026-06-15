// Renders a simple bar or line chart for ACT Reading "graph passage" figures.
// figure: { caption, type: "bar"|"line", xLabel, yLabel, series: [{ name, points: [{x, y}] }] }

const SERIES_COLORS = ["#3b82f6", "#22d3ee"]; // electric, cyan

export default function ChartFigure({ figure }) {
  const { caption, type, xLabel, yLabel, series } = figure;

  // Categories come from the first series; assume series share the x labels.
  const categories = series[0]?.points.map((p) => p.x) ?? [];
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const maxY = Math.max(1, ...allY);
  const minY = Math.min(0, ...allY);
  const range = maxY - minY || 1;

  // Plot geometry (SVG user units).
  const W = 340;
  const H = 220;
  const padL = 44;
  const padR = 12;
  const padT = 14;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (i) => padL + (plotW * (i + 0.5)) / Math.max(1, categories.length);
  const yFor = (v) => padT + plotH * (1 - (v - minY) / range);

  // Y gridlines / ticks (4 steps).
  const ticks = Array.from({ length: 5 }, (_, i) => minY + (range * i) / 4);

  return (
    <figure className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <figcaption className="mb-2 font-display text-xs font-bold text-cyan-300">{caption}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={caption}>
        {/* gridlines + y ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={yFor(t)}
              x2={W - padR}
              y2={yFor(t)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text x={padL - 6} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {Math.round(t * 100) / 100}
            </text>
          </g>
        ))}

        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="rgba(255,255,255,0.25)" />
        <line
          x1={padL}
          y1={padT + plotH}
          x2={W - padR}
          y2={padT + plotH}
          stroke="rgba(255,255,255,0.25)"
        />

        {/* data */}
        {type === "line"
          ? series.map((s, si) => (
              <polyline
                key={si}
                fill="none"
                stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
                strokeWidth="2"
                points={s.points.map((p, i) => `${xFor(i)},${yFor(p.y)}`).join(" ")}
              />
            ))
          : series.map((s, si) => {
              const groupW = plotW / Math.max(1, categories.length);
              const barW = Math.max(4, (groupW * 0.6) / series.length);
              return s.points.map((p, i) => {
                const cx = xFor(i) - (series.length * barW) / 2 + si * barW;
                const y = yFor(p.y);
                return (
                  <rect
                    key={`${si}-${i}`}
                    x={cx}
                    y={y}
                    width={barW}
                    height={padT + plotH - y}
                    rx="1.5"
                    fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                    opacity="0.85"
                  />
                );
              });
            })}

        {/* x labels */}
        {categories.map((c, i) => (
          <text key={i} x={xFor(i)} y={padT + plotH + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {String(c).length > 8 ? `${String(c).slice(0, 7)}…` : c}
          </text>
        ))}

        {/* axis labels */}
        {xLabel && (
          <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#cbd5e1">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            x={12}
            y={padT + plotH / 2}
            textAnchor="middle"
            fontSize="9"
            fill="#cbd5e1"
            transform={`rotate(-90 12 ${padT + plotH / 2})`}
          >
            {yLabel}
          </text>
        )}
      </svg>

      {/* legend (only when more than one series) */}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {series.map((s, si) => (
            <span key={si} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: SERIES_COLORS[si % SERIES_COLORS.length] }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
