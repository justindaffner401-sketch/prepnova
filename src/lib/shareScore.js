// Builds a branded, square (1080×1080) score card on a canvas and shares it:
// native share sheet with the image file where supported (mobile → TikTok/IG/
// Messages), otherwise downloads the PNG and copies the site link. No deps; text
// is drawn directly so there are no font-loading or canvas-tainting issues.

const SIZE = 1080;
const SITE = "prepnovaai.com";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRing(ctx, cx, cy, r, pct) {
  ctx.lineWidth = 40;
  ctx.lineCap = "round";
  // track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.stroke();
  // progress
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "#3b82f6");
  grad.addColorStop(1, "#22d3ee");
  const start = -Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + (Math.max(0, Math.min(100, pct)) / 100) * Math.PI * 2);
  ctx.strokeStyle = grad;
  ctx.stroke();
}

function drawCard(ctx, { percent, test, subjectLabel, score, total }) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, "#0b1230");
  bg.addColorStop(0.55, "#070b1e");
  bg.addColorStop(1, "#03060f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Soft cyan glow top-right
  const glow = ctx.createRadialGradient(820, 220, 40, 820, 220, 560);
  glow.addColorStop(0, "rgba(34,211,238,0.18)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Wordmark (two-tone)
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = "700 56px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Prep", 90, 150);
  const prepW = ctx.measureText("Prep").width;
  ctx.fillStyle = "#38e0f5";
  ctx.fillText("Nova", 90 + prepW, 150);

  // Ring + score
  drawRing(ctx, SIZE / 2, 520, 250, percent);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 200px Arial, sans-serif";
  ctx.fillText(`${percent}%`, SIZE / 2, 590);
  ctx.font = "600 44px Arial, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`${test} · ${subjectLabel}`, SIZE / 2, 660);

  // Score detail pill
  ctx.font = "700 40px Arial, sans-serif";
  const detail = `${score} / ${total} correct`;
  const dW = ctx.measureText(detail).width;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, SIZE / 2 - dW / 2 - 34, 840, dW + 68, 84, 42);
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(detail, SIZE / 2, 896);

  // Footer tagline
  ctx.font = "600 38px Arial, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("My ACT/SAT prep, leveled up", SIZE / 2, 1000);
  ctx.font = "700 40px Arial, sans-serif";
  ctx.fillStyle = "#38e0f5";
  ctx.fillText(SITE, SIZE / 2, 1056);
}

/** Returns the score card as a PNG Blob (used for sharing and previewing). */
export async function buildScoreCardBlob(data) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  drawCard(ctx, data);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Share the score card. Native share with the image where supported; otherwise
 * download the PNG and copy the site link. Returns { method } or throws only on
 * a genuine failure (a user-cancelled share resolves quietly).
 */
export async function shareScoreCard(data) {
  const blob = await buildScoreCardBlob(data);
  if (!blob) return { method: "none" };
  const file = new File([blob], "prepnova-score.png", { type: "image/png" });
  const text = `I scored ${data.percent}% on ${data.test} ${data.subjectLabel} with PrepNova.`;

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: "My PrepNova score", text, files: [file] });
      return { method: "share" };
    } catch (err) {
      if (err?.name === "AbortError") return { method: "cancelled" };
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prepnova-score.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  try {
    await navigator.clipboard?.writeText(`${text} https://www.${SITE}`);
  } catch {
    /* clipboard optional */
  }
  return { method: "download" };
}
