const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
};

function ScoreGauge({ score }) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score, 100)) / 100;
  const offset = circumference * (1 - progress);

  let scoreColor = "#0052FF";
  if (score <= 60) scoreColor = "#F59E0B";
  if (score < 40) scoreColor = "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 240 240" className="h-[250px] w-[250px] -rotate-90">
        <circle cx="120" cy="120" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="16" />

        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />

        <path
          d={describeArc(120, 120, 106, 210, 330)}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-7">
        <span className="mb-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Financial score
        </span>
        <span className="text-6xl font-extrabold leading-none" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="mt-2 text-sm font-medium uppercase tracking-[0.3em] text-gray-400">
          / 100
        </span>
      </div>
    </div>
  );
}

export default ScoreGauge;
