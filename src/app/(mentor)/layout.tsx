import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/app/AppShell'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session) redirect('/sign-in')
  if (!session.user.onboardingComplete) redirect('/onboarding')
  if (session.user.systemRole === 'student') redirect('/dashboard')

  // Use AppShell in the layout to wrap all mentor routes
  return <AppShell user={session.user as any}>{children}</AppShell>
}
