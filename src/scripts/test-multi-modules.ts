import { createCourse } from '../server/courses'

import { db } from '../db'
import { user } from '../db/schema'

async function test() {
  console.log('Testing Multi-Module Course Creation...')
  const [firstUser] = await db.select({ id: user.id }).from(user).limit(1)
  const mentorId = firstUser?.id || 'admin'
  console.log('Using mentor ID:', mentorId)

  const result = await createCourse(
    {
      title: 'Full-Stack Katalyst Accelerator',
      subtitle: 'Blended journey with workshops, coaching, projects, and assignments',
      description: 'Comprehensive program covering all 6 pedagogical module types.',
      coverEmoji: '🚀',
      category: 'technical',
      track: 'optional',
      difficulty: 'intermediate',
      certificateEligible: true,
      estimatedHours: 24,
      xpBonusOnComplete: 150,
      status: 'published',
      mentorId,
      sections: [
      {
        title: 'Module 1: Live Interactive Workshop',
        summary: 'Webinar with industry mentor',
        type: 'training_session',
        xpAward: 80,
        orderIndex: 0,
        meta: {
          meetingUrl: 'https://meet.google.com/test-session',
          speakerName: 'Dr. Rajesh Khanna',
        },
        lessons: [
          {
            title: 'Live Masterclass Link',
            kind: 'link',
            contentUrl: 'https://meet.google.com/test-session',
            durationMin: 60,
            xpAward: 50,
            orderIndex: 0,
          },
        ],
      },
      {
        title: 'Module 2: Video & Reading Curriculum',
        summary: 'Self-paced architecture guide',
        type: 'online_course',
        xpAward: 60,
        orderIndex: 1,
        meta: {},
        lessons: [
          {
            title: 'Core Concepts Lecture',
            kind: 'video',
            contentUrl: 'https://youtube.com/watch?v=sample',
            durationMin: 20,
            xpAward: 25,
            orderIndex: 0,
          },
        ],
      },
      {
        title: 'Module 3: 1-on-1 Mentoring Sync',
        summary: 'Personal coaching and reflection',
        type: 'mentoring_task',
        xpAward: 100,
        orderIndex: 2,
        meta: {
          discussionTopic: 'Career strategy and submission review',
        },
        lessons: [
          {
            title: 'Sync Notes & Goals',
            kind: 'reading',
            contentBody: 'Document goals',
            durationMin: 30,
            xpAward: 50,
            orderIndex: 0,
          },
        ],
      },
      {
        title: 'Module 4: Capstone Project Build',
        summary: 'Hands-on application build and demo',
        type: 'project',
        xpAward: 200,
        orderIndex: 3,
        meta: {
          deliverables: 'GitHub repo & Vercel demo',
          rubric: 'Execution 50%, Code Quality 50%',
          maxScore: 100,
        },
        lessons: [
          {
            title: 'Project Submission',
            kind: 'link',
            contentUrl: 'https://github.com',
            durationMin: 120,
            xpAward: 150,
            orderIndex: 0,
          },
        ],
      },
      {
        title: 'Module 5: Graded Case Study Assignment',
        summary: 'AI Coach evaluation and mentor grading',
        type: 'assignment',
        xpAward: 150,
        orderIndex: 4,
        meta: {
          rubric: 'Evidence (25%), Analysis (35%), Clarity (20%), Action (20%)',
          maxScore: 100,
        },
        lessons: [
          {
            title: 'Case Study Submission',
            kind: 'reading',
            contentBody: 'Submit analysis',
            durationMin: 45,
            xpAward: 100,
            orderIndex: 0,
          },
        ],
      },
      {
        title: 'Module 6: Final Milestone & Certification',
        summary: 'Earn the Katalyst Graduate Badge',
        type: 'milestone',
        xpAward: 120,
        orderIndex: 5,
        meta: {},
        lessons: [
          {
            title: 'Claim Certificate Badge',
            kind: 'link',
            contentUrl: '',
            durationMin: 15,
            xpAward: 120,
            orderIndex: 0,
          },
        ],
      },
    ],
  })

  console.log('✅ Created Course ID:', result.course.id)
  console.log('✅ Total Sections:', result.course.sectionCount)
  console.log('✅ Total Lessons:', result.course.lessonCount)
  console.log('✅ Total Calculated XP:', result.course.totalXp)
}

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
