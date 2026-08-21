'use client'

import React, { createContext, useContext, useState } from 'react'

export interface StudentProfileState {
  name: string
  level: number
  streakCount: number
  xpTotal: number
  unreadNotifications: number
  avatarUrl: string
}

interface StudentProfileContextType {
  profile: StudentProfileState
  updateProfile: (updates: Partial<StudentProfileState>) => void
}

const defaultProfile: StudentProfileState = {
  name: 'Alex',
  level: 3,
  streakCount: 5,
  xpTotal: 420,
  unreadNotifications: 2,
  avatarUrl: '',
}

const StudentProfileContext = createContext<StudentProfileContextType>({
  profile: defaultProfile,
  updateProfile: () => {},
})

export function StudentProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfileState>(defaultProfile)

  const updateProfile = (updates: Partial<StudentProfileState>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  return (
    <StudentProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </StudentProfileContext.Provider>
  )
}

export function useStudentProfile() {
  return useContext(StudentProfileContext)
}
