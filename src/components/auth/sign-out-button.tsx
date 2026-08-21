'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { signOut } from '@/lib/auth-client'

/**
 * The one sign-out control, shared by the student dashboard and the mentor console.
 *
 * `router.refresh()` after the push is load-bearing: every guard in the app
 * (`(student)/layout`, `mentor/layout`, `(auth)/layout`) is a server component that reads
 * the session cookie. Without the refresh the client router can serve those from its
 * cache and the app still looks signed in until a hard reload.
 *
 * `className` is passed in rather than baked, because the two shells style their chrome
 * completely differently.
 */
export function SignOutButton({
  className,
  label = 'Sign out',
}: {
  className?: string
  label?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    try {
      await signOut()
    } finally {
      // Land on the public home page — it offers Sign In / Sign Up.
      router.push('/')
      router.refresh()
    }
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={pending} className={className}>
      {pending ? 'Signing out…' : label}
    </button>
  )
}
