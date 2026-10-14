"use client";

interface Props {
  // one entry per axis, value 0-1 = lean toward `label`
  axes: { label: string; value: number; sub: string }[];
  size?: number;
}

// Simple 4-point radar/spider chart rendered as SVG — no charting library
// needed for a 4-axis shape.
export default function RadarChart({ axes, size = 260 }: Props) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const angleStep = (Math.PI * 2) / axes.length;
  const angleFor = (i: number) => -Math.PI / 2 + i * angleStep;

  const pointAt = (i: number, r: number) => {
    const a = angleFor(i);
    return [center + r * Math.cos(a), center + r * Math.sin(a)];
  };

  const ringLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = axes.map((axis, i) => pointAt(i, radius * Math.max(axis.value, 0.06)));
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full overflow-visible"
      style={{ maxWidth: size }}
    >
      {ringLevels.map((level) => {
        const pts = axes.map((_, i) => pointAt(i, radius * level).join(",")).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            className="stroke-neutral-300 dark:stroke-neutral-700"
            strokeWidth={1}
          />
        );
      })}

      {axes.map((_, i) => {
        const [x, y] = pointAt(i, radius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            className="stroke-neutral-300 dark:stroke-neutral-700"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={dataPath}
        fill="url(#radarFill)"
        stroke="#3b82f6"
        strokeWidth={2}
        className="animate-fade-in"
      />
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#172554" stopOpacity={0.25} />
        </linearGradient>
      </defs>

      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#1d4ed8" />
      ))}

      {axes.map((axis, i) => {
        const [x, y] = pointAt(i, radius + 26);
        return (
          <text
            key={axis.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-neutral-700 text-[11px] font-semibold dark:fill-neutral-200"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
