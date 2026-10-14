"use client";

import { useEffect, useRef, useState } from "react";
import { fetchStats } from "@/lib/api";
import { AXIS_LABELS, AXIS_NAMES_ORDERED, LETTER_NAMES, PredictResponse, TYPE_DESCRIPTIONS } from "@/lib/types";
import { IdentityResult } from "@/lib/identity";

interface Props {
  result: PredictResponse;
  identity: IdentityResult;
}

const WIDTH = 500;
const HEIGHT = 700;

// Brand gradient hex values, matched to tailwind.config.ts's `brand` scale
// (canvas fillStyle can't consume Tailwind classes directly).
const BRAND_600 = "#1d4ed8";
const BRAND_400 = "#3b82f6";
const BRAND_300 = "#93c5fd";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, centerX, y);
  return y + lineHeight;
}

// Renders a shareable "personality passport" card to an offscreen canvas —
// type letters, tagline, per-axis mini bars, the experimental identity
// letter from lib/identity.ts, and (when available) how rare the type is
// among recorded results — then offers a plain browser download of the PNG.
export default function PersonalityPassport({ result, identity }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rarity, setRarity] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((stats) => {
        if (cancelled) return;
        const count = stats.type_counts?.[result.predicted_type];
        if (count && stats.total_predictions) {
          setRarity(`${count} / ${stats.total_predictions} results`);
        }
      })
      .catch(() => {
        // Rarity is a nice-to-have on the card — silently omit it on failure.
      });
    return () => {
      cancelled = true;
    };
  }, [result.predicted_type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Top accent bar, brand gradient
    const accent = ctx.createLinearGradient(0, 0, WIDTH, 0);
    accent.addColorStop(0, BRAND_600);
    accent.addColorStop(1, BRAND_400);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, WIDTH, 10);

    ctx.textAlign = "center";
    ctx.fillStyle = BRAND_300;
    ctx.font = "600 15px Arial, sans-serif";
    ctx.fillText("MINDPRINT PERSONALITY PASSPORT", WIDTH / 2, 55);

    // Big type letters
    const typeGrad = ctx.createLinearGradient(WIDTH / 2 - 120, 0, WIDTH / 2 + 120, 0);
    typeGrad.addColorStop(0, BRAND_600);
    typeGrad.addColorStop(1, BRAND_400);
    ctx.fillStyle = typeGrad;
    ctx.font = "800 76px Arial, sans-serif";
    ctx.fillText(result.predicted_type, WIDTH / 2, 155);

    // Identity suffix (experimental)
    ctx.font = "600 18px Arial, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`-${identity.letter}  ·  ${identity.label}`, WIDTH / 2, 185);

    // Description
    ctx.font = "400 15px Arial, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    const desc = TYPE_DESCRIPTIONS[result.predicted_type] ?? "";
    let y = wrapText(ctx, desc, WIDTH / 2, 225, WIDTH - 90, 21);

    // Axis mini bars
    y = Math.max(y + 20, 300);
    ctx.textAlign = "left";
    for (const axis of AXIS_NAMES_ORDERED) {
      const [leftLabel, rightLabel] = AXIS_LABELS[axis];
      const rightProb = result.axes[axis]?.probabilities[rightLabel] ?? 0.5;
      const leansRight = rightProb >= 0.5;
      const winPct = Math.round(Math.max(rightProb, 1 - rightProb) * 100);
      const winLetter = leansRight ? rightLabel : leftLabel;

      // Letters at each end; the side they lean to is brighter.
      ctx.font = "700 14px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = leansRight ? "#64748b" : "#e2e8f0";
      ctx.fillText(leftLabel, 55, y + 4);
      ctx.textAlign = "right";
      ctx.fillStyle = leansRight ? "#e2e8f0" : "#64748b";
      ctx.fillText(rightLabel, WIDTH - 55, y + 4);

      const trackX = 85;
      const trackWidth = WIDTH - 170;
      const mid = trackX + trackWidth / 2;
      const pos = trackX + trackWidth * rightProb;

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(ctx, trackX, y - 7, trackWidth, 12, 6);
      ctx.fill();

      // Same as the on-page bars: fill from the middle toward the lean.
      const barGrad = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
      barGrad.addColorStop(0, BRAND_600);
      barGrad.addColorStop(1, BRAND_400);
      ctx.fillStyle = barGrad;
      const fillX = Math.min(mid, pos);
      const fillWidth = Math.max(4, Math.abs(pos - mid));
      roundRect(ctx, fillX, y - 7, fillWidth, 12, 6);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(mid - 0.5, y - 10, 1, 18);

      ctx.beginPath();
      ctx.arc(pos, y - 1, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos, y - 1, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = BRAND_600;
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "400 12px Arial, sans-serif";
      ctx.fillText(`${winPct}% ${LETTER_NAMES[winLetter] ?? winLetter}`, WIDTH / 2, y + 28);

      y += 58;
    }

    // Footer: rarity if available, else site name
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "400 13px Arial, sans-serif";
    ctx.fillText(rarity ? rarity : "mindprint", WIDTH / 2, HEIGHT - 28);
  }, [result, identity, rarity]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindprint-${result.predicted_type}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[240px]">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label={`${result.predicted_type} personality passport preview`}
          className="h-auto w-full rounded-2xl border border-neutral-200 object-contain shadow dark:border-neutral-800"
        />
      </div>
      <button
        onClick={handleDownload}
        className="rounded-xl border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Download passport (PNG)
      </button>
    </div>
  );
}
