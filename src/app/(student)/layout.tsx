import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/app/AppShell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session) redirect('/sign-in')
  if (!session.user.onboardingComplete) redirect('/onboarding')

  // Use AppShell in the layout to wrap all student routes
  return <AppShell user={session.user as any}>{children}</AppShell>
}
