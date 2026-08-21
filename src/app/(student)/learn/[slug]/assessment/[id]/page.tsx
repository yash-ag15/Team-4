import Link from 'next/link'

import { mockAssessmentContext } from '@/mocks/ai-coach'

import { AssessmentWorkspace, type WorkspaceAssessment } from './assessment-workspace'

/**
 * FEATURE 04 — assessment detail. Route: /learn/[slug]/assessment/[id]
 *
 * Normally Samya's (feature 04 frontend); built here at Yash's request so the AI Coach
 * loop is provable in a browser instead of only in `npm run ai:smoke`.
 *
 * `params` is a Promise in Next 16 — it must be awaited.
 */

/**
 * TODO(feature-02, Siddesh): replace with
 *   const { assessment, course } = await api.courses.getAssessment({ id })
 * once `src/contracts/courses.ts` is registered. Until then this reads the same fixture
 * the AI Coach's own mock uses, so the rubric on screen is the rubric the model grades
 * against — no drift between what the student sees and what the coach is told.
 */
async function loadAssessment(id: string): Promise<WorkspaceAssessment> {
  const a = mockAssessmentContext
  return {
    id: a.id === id ? a.id : id,
    title: a.title,
    prompt:
      'Using the enrolment dataset, identify where students are dropping out of the ' +
      'programme and recommend one intervention. Support every claim with a specific ' +
      'figure from the data.',
    rubric: a.rubric,
    maxScore: a.maxScore,
    xpAward: a.xpAward,
    courseTitle: a.courseTitle,
    track: a.track,
  }
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const assessment = await loadAssessment(id)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <nav className="text-xs text-gray-500">
        <Link href={`/learn/${slug}`} className="hover:text-gray-900 hover:underline">
          ← Back to {assessment.courseTitle}
        </Link>
      </nav>

      <AssessmentWorkspace assessment={assessment} />
    </main>
  )
}
