'use client'

import React, { useState } from 'react'

interface NudgeButtonProps {
  studentName: string
  studentEmail: string
  reason?: string
  studentId?: string
}

export function NudgeButton({ studentName, studentEmail, reason, studentId }: NudgeButtonProps) {
  const [nudged, setNudged] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleNudge = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      const subject = encodeURIComponent(`Katalyst Check-in: How is your learning going?`)
      const body = encodeURIComponent(
        `Hi ${studentName},\n\n` +
        `I noticed that you might need some support (${reason || 'recent learning check-in'}). ` +
        `Please log in to Katalyst to continue your learning journey or reach out if you have questions!\n\n` +
        `Best regards,\nYour Mentor`
      )
      window.open(`mailto:${studentEmail}?subject=${subject}&body=${body}`, '_blank')
      setNudged(true)
    } catch {
      window.location.href = `mailto:${studentEmail}`
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleNudge}
      disabled={loading || nudged}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 shadow-xs cursor-pointer ${
        nudged
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300/80 cursor-default'
          : 'bg-white text-[#2596be] border-[#2596be]/30 hover:bg-gradient-to-r hover:from-[#2596be] hover:to-[#ec4899] hover:text-white hover:border-transparent hover:shadow-md hover:shadow-[#2596be]/20 active:scale-95'
      }`}
    >
      {loading ? (
        <span>Sending...</span>
      ) : nudged ? (
        <>
          <span className="text-emerald-600 font-bold">✓</span>
          <span>Nudged</span>
        </>
      ) : (
        <>
          <span className="text-[#e8da4d] group-hover:text-white">⚡</span>
          <span>Nudge</span>
        </>
      )}
    </button>
  )
}
