/**
 * Dev-only student dashboard preview — no auth required.
 * Methika's ownership: components/ui/*, app/(student)/dashboard/*, globals.css
 */

import { DashboardView } from '@/components/dashboard/dashboard-view'

export const metadata = {
  title: 'Dev Preview — Student Dashboard',
}

export default function DashboardPreviewPage() {
  return <DashboardView />
}
