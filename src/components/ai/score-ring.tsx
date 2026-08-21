const SIZE_DEFAULT = 120
const STROKE_WIDTH = 10

export function ScoreRing({
  value,
  max,
  size = SIZE_DEFAULT,
}: {
  value: number
  max: number
  size?: number
}) {
  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const percent = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const dashOffset = circumference * (1 - percent)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-[#2596BE] transition-[stroke-dashoffset]"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-semibold tracking-tight text-gray-900">{value}</span>
        <span className="text-xs text-gray-500">/ {max}</span>
      </div>
    </div>
  )
}
