'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { ActiveSession } from '@/contracts/sessions'
import { api, ApiClientError } from '@/lib/api-client'
import { signOut } from '@/lib/auth-client'

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export function SessionConflict({
  sessions,
  email,
  continueHref,
}: {
  sessions: ActiveSession[]
  email: string
  continueHref: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<'terminate' | 'signout' | null>(null)

  async function terminateOthers() {
    setError(null)
    setPending('terminate')
    try {
      await api.sessions.revokeOthers()
      router.replace(continueHref)
      router.refresh()
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : 'Could not end the other sessions. Try again.',
      )
      setPending(null)
    }
  }

  // The other person may be the legitimate one. Backing out has to be one click.
  async function leave() {
    setPending('signout')
    await signOut()
    router.replace('/sign-in')
    router.refresh()
  }

  const plural = sessions.length > 1

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Active session detected
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {plural ? 'Other devices are' : 'Another device is'} signed in
        </h1>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{email}</span> is already signed in
          {plural ? ` on ${sessions.length} other devices` : ' somewhere else'}. You can end{' '}
          {plural ? 'those sessions' : 'that session'} and continue here, or leave{' '}
          {plural ? 'them' : 'it'} alone and sign out.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-md border border-gray-200 px-3 py-2.5">
            <p className="text-sm font-medium text-gray-900">{s.device}</p>
            <p className="text-xs text-gray-500">
              Signed in {formatWhen(s.createdAt)}
              {s.ipAddress ? ` • ${s.ipAddress}` : ''}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={terminateOthers}
          disabled={pending !== null}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending === 'terminate'
            ? 'Ending…'
            : `End ${plural ? 'those sessions' : 'that session'} and continue`}
        </button>

        <button
          type="button"
          onClick={leave}
          disabled={pending !== null}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {pending === 'signout' ? 'Signing out…' : 'Cancel and sign out'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Ending a session signs that device out immediately. It does not change the password —
        if you did not expect this, change your password after continuing.
      </p>
    </main>
  )
}
