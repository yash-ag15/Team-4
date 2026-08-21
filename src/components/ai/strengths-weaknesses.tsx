export function StrengthsWeaknesses({
  strengths,
  weaknesses,
}: {
  strengths: string[]
  weaknesses: string[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-gray-200 border-l-4 border-l-[#2596BE] bg-[#2596BE]/5 p-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-[#2596BE]">
          Strengths
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {strengths.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span aria-hidden className="text-[#2596BE]">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-gray-200 border-l-4 border-l-[#E8DA4D] bg-[#E8DA4D]/10 p-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-700">
          Weaknesses
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {weaknesses.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span aria-hidden className="text-gray-500">
                ⚠
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
