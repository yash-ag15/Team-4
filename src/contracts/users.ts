import { z } from 'zod'
import { defineContract } from './_kit'
import { mockUsers } from '@/mocks/factories'

export const SYSTEM_ROLES = ['student', 'mentor', 'admin'] as const

/** The public profile shape. Never include anything the client must not see. */
export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  systemRole: z.enum(SYSTEM_ROLES),
  cohortYear: z.string(),
  campus: z.string(),
  phone: z.string(),
  city: z.string(),
  onboardingComplete: z.boolean(),
  createdAt: z.string(), // ISO string
})
export type User = z.infer<typeof User>

export const me = defineContract({
  method: 'GET',
  path: '/api/users/me',
  auth: 'user',
  summary: 'The signed-in user profile',
  input: z.object({}),
  output: z.object({ user: User }),
  mock: () => ({ user: mockUsers[0] as unknown as User }),
})

export const updateProfile = defineContract({
  method: 'PATCH',
  path: '/api/users/me',
  auth: 'user',
  summary: 'Update the signed-in user profile',
  input: z.object({
    name: z.string().min(1).max(80).optional(),
    cohortYear: z.string().optional(),
    campus: z.string().max(120).optional(),
    phone: z.string().max(40).optional(),
    city: z.string().max(80).optional(),
  }),
  output: z.object({ user: User }),
  mock: (patch) => ({
    user: {
      ...mockUsers[0] as unknown as User,
      ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    },
  }),
})

export const completeOnboarding = defineContract({
  method: 'POST',
  path: '/api/users/onboarding',
  auth: 'user',
  summary: 'Finish the onboarding gate — sets onboardingComplete server-side',
  input: z.object({
    cohortYear: z.string(),
    campus: z.string().max(120).optional(),
    phone: z.string().max(40).optional(),
    city: z.string().max(80).optional(),
    mentorCode: z.string().optional(),
  }),
  output: z.object({ user: User }),
  mock: ({ cohortYear, campus, phone, city, mentorCode }) => ({
    user: {
      ...mockUsers[0] as unknown as User,
      cohortYear,
      campus: campus ?? '',
      phone: phone ?? '',
      city: city ?? '',
      systemRole: (mentorCode ? 'mentor' : 'student') as 'student' | 'mentor' | 'admin',
      onboardingComplete: true,
    },
  }),
})
