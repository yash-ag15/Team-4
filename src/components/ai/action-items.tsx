'use client'

import { useState } from 'react'

/**
 * Ticking an item is local-only — a coaching nudge, not persisted state. No API call, no
 * contract, no database write.
 */
export function ActionItems({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
        Action items
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, i) => {
          const id = `action-item-${i}`
          return (
            <li key={i} className="flex items-start gap-2">
              <input
                id={id}
                type="checkbox"
                checked={Boolean(checked[i])}
                onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                className="mt-1 accent-[#2596BE]"
              />
              <label
                htmlFor={id}
                className={`text-sm ${checked[i] ? 'text-gray-400 line-through' : 'text-gray-700'}`}
              >
                {item}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
