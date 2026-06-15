// Renders a math question's figure: a geometry diagram (polygons / circles +
// labels) or a coordinate plot (curves + axes). All input coordinates are in a
// math plane bounded by [xMin,xMax] x [yMin,yMax]; we map them into an SVG
// viewBox and flip y so up is positive.

export default function MathFigure({ figure }) {
  if (!figure) return null;
  const { polygons, circles, curves, labels, showAxes, xMin, xMax, yMin, yMax } = figure;

  const W = 300;
  const H = 240;
  const pad = 28;
  const spanX = xMax - xMin || 1;
  const spanY = yMax - yMin || 1;
  // Uniform scale keeps shapes from distorting; center within the viewBox.
  const scale = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
  const drawW = spanX * scale;
  const drawH = spanY * scale;
  const offX = (W - drawW) / 2;
  const offY = (H - drawH) / 2;
  const sx = (x) => offX + (x - xMin) * scale;
  const sy = (y) => H - (offY + (y - yMin) * scale); // flip y

  // Integer axis ticks within range (capped so dense graphs stay readable).
  const ticks = (min, max) => {
    const out = [];
    const start = Math.ceil(min);
    const end = Math.floor(max);
    const step = Math.max(1, Math.ceil((end - start) / 10));
    for (let v = start; v <= end; v += step) out.push(v);
    return out;
  };

  const axisAt0X = xMin <= 0 && xMax >= 0;
  const axisAt0Y = yMin <= 0 && yMax >= 0;

  return (
    <figure className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[320px]" role="img">
        {showAxes && (
          <g>
            {ticks(xMin, xMax).map((v) => (
              <line
                key={`gx${v}`}
                x1={sx(v)}
                y1={sy(yMin)}
                x2={sx(v)}
                y2={sy(yMax)}
                stroke="rgba(255,255,255,0.06)"
              />
            ))}
            {ticks(yMin, yMax).map((v) => (
              <line
                key={`gy${v}`}
                x1={sx(xMin)}
                y1={sy(v)}
                x2={sx(xMax)}
                y2={sy(v)}
                stroke="rgba(255,255,255,0.06)"
              />
            ))}
            {/* axes through origin when in range */}
            <line
              x1={sx(xMin)}
              y1={sy(axisAt0Y ? 0 : yMin)}
              x2={sx(xMax)}
              y2={sy(axisAt0Y ? 0 : yMin)}
              stroke="rgba(255,255,255,0.35)"
            />
            <line
              x1={sx(axisAt0X ? 0 : xMin)}
              y1={sy(yMin)}
              x2={sx(axisAt0X ? 0 : xMin)}
              y2={sy(yMax)}
              stroke="rgba(255,255,255,0.35)"
            />
          </g>
        )}

        {/* polygons (geometry shapes) */}
        {polygons.map((p, i) => {
          const pts = p.points.map((pt) => `${sx(pt.x)},${sy(pt.y)}`).join(" ");
          const El = p.closed ? "polygon" : "polyline";
          return (
            <El
              key={`poly${i}`}
              points={pts}
              fill={p.closed ? "rgba(59,130,246,0.12)" : "none"}
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          );
        })}

        {/* circles */}
        {circles.map((c, i) => (
          <circle
            key={`circ${i}`}
            cx={sx(c.cx)}
            cy={sy(c.cy)}
            r={c.r * scale}
            fill="rgba(59,130,246,0.10)"
            stroke="#60a5fa"
            strokeWidth="2"
          />
        ))}

        {/* curves (function plots) */}
        {curves.map((c, i) => (
          <polyline
            key={`curve${i}`}
            points={c.points.map((pt) => `${sx(pt.x)},${sy(pt.y)}`).join(" ")}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
          />
        ))}

        {/* labels (side lengths, angles, vertex names, points) */}
        {labels.map((l, i) => (
          <text
            key={`lbl${i}`}
            x={sx(l.x)}
            y={sy(l.y)}
            fontSize="11"
            fill="#e2e8f0"
            textAnchor="middle"
            dominantBaseline="middle"
            stroke="#0b1220"
            strokeWidth="0.5"
            paintOrder="stroke"
          >
            {l.text}
          </text>
        ))}
      </svg>
    </figure>
  );
}
