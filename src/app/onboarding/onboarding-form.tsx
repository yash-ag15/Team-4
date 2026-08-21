'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { api, ApiClientError } from '@/lib/api-client'

const inputClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900'

export interface OnboardingDefaults {
  cohortYear: string
  campus: string
  phone: string
  city: string
}

export function OnboardingForm({ defaults }: { defaults: OnboardingDefaults }) {
  const router = useRouter()
  const [cohortYear, setCohortYear] = useState(defaults.cohortYear)
  const [campus, setCampus] = useState(defaults.campus)
  const [phone, setPhone] = useState(defaults.phone)
  const [city, setCity] = useState(defaults.city)
  const [showMentorCode, setShowMentorCode] = useState(false)
  const [mentorCode, setMentorCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setErrors({})
    setPending(true)

    try {
      await api.users.completeOnboarding({ cohortYear, campus, phone, city, mentorCode })
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      if (e instanceof ApiClientError && e.fields) {
        const newErrors: Record<string, string> = {}
        for (const [k, msgs] of Object.entries(e.fields)) {
          newErrors[k] = msgs[0]
        }
        setErrors(newErrors)
      } else {
        setError(e instanceof Error ? e.message : 'Could not save your profile')
      }
      setPending(false)
    }
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Cohort Year</span>
          <select
            name="cohortYear"
            value={cohortYear}
            onChange={(e) => setCohortYear(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>Select cohort year</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          {errors.cohortYear && <span className="text-xs text-red-500">{errors.cohortYear}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Campus</span>
          <input
            type="text"
            name="campus"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className={inputClass}
          />
          {errors.campus && <span className="text-xs text-red-500">{errors.campus}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
          {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">City</span>
          <input
            type="text"
            name="city"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
          {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
        </label>

        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMentorCode}
              onChange={(e) => setShowMentorCode(e.target.checked)}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm font-medium text-gray-700">I'm a mentor</span>
          </label>
          {showMentorCode && (
            <label className="flex flex-col gap-1.5 mt-2">
              <span className="text-sm font-medium">Mentor Code</span>
              <input
                type="text"
                name="mentorCode"
                value={mentorCode}
                onChange={(e) => setMentorCode(e.target.value)}
                className={inputClass}
                placeholder="Enter mentor code"
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 mt-4"
        >
          {pending ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </>
  )
}
