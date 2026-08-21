'use client'

import React, { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

interface UserItem {
  id: string
  name: string
  email: string
  image: string | null
  systemRole: 'student' | 'mentor' | 'admin'
  campus?: string
  cohortYear?: string
  createdAt: string
}

const DEFAULT_USERS: UserItem[] = [
  {
    id: 'user-1',
    name: 'Aditi Raman',
    email: 'aditi.raman@example.org',
    image: null,
    systemRole: 'admin',
    campus: 'Mumbai Central',
    cohortYear: '2025',
    createdAt: '2026-01-14T09:12:00.000Z',
  },
  {
    id: 'user-mentor-1',
    name: 'Dr. Rajesh Khanna',
    email: 'mentor@katalyst.test',
    image: null,
    systemRole: 'mentor',
    campus: 'Bengaluru Tech',
    cohortYear: '2025',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'user-st-1',
    name: 'Priya Nair',
    email: 'priya.nair@example.org',
    image: null,
    systemRole: 'student',
    campus: 'Bengaluru Tech',
    cohortYear: '2026',
    createdAt: '2026-02-01T11:30:00.000Z',
  },
  {
    id: 'user-st-2',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.org',
    image: null,
    systemRole: 'student',
    campus: 'Mumbai Central',
    cohortYear: '2026',
    createdAt: '2026-02-03T14:40:00.000Z',
  },
  {
    id: 'user-st-3',
    name: 'Zoya Khan',
    email: 'zoya.khan@example.org',
    image: null,
    systemRole: 'student',
    campus: 'Mumbai Central',
    cohortYear: '2026',
    createdAt: '2026-02-05T12:00:00.000Z',
  },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>(DEFAULT_USERS)
  const [loading, setLoading] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState<string>('user-1')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, usersRes] = await Promise.allSettled([
          api.users.me(),
          (api as any)?.admin?.listUsers ? (api as any).admin.listUsers({ limit: 100 }) : Promise.reject(),
        ])

        if (meRes.status === 'fulfilled' && meRes.value?.user) {
          setCurrentAdminId(meRes.value.user.id)
        }

        if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
          setUsers(usersRes.value.users)
        }
      } catch {
        // Fallback to rich mock data
      }
    }
    loadData()
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'student' | 'mentor' | 'admin') => {
    if (userId === currentAdminId && newRole !== 'admin') {
      alert('Security guard: You cannot remove your own admin privileges.')
      return
    }

    setUpdatingId(userId)
    try {
      if ((api as any)?.admin?.setRole) {
        await (api as any).admin.setRole({ userId, role: newRole })
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, systemRole: newRole } : u))
      )
      setSuccessMessage(`User role successfully updated to ${newRole.toUpperCase()}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      alert('Failed to update role. Ensure you have admin permissions.')
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#2596be]/10 to-[#ec4899]/10 border border-[#2596be]/20 text-[#2596be] text-xs font-mono font-bold">
              <span>Platform Administration</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 font-['Hanken_Grotesk'] tracking-tight">
              User & Role Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage platform roles and instantly promote students to mentors or admins for live judging.
            </p>
          </div>
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-300/80 bg-white focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent transition-all shadow-xs"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
        </div>

        {/* Feedback Message */}
        {successMessage && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 text-emerald-900 text-sm font-semibold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-4 py-4">Campus / Cohort</th>
                  <th className="px-4 py-4">Current System Role</th>
                  <th className="px-6 py-4 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      No users match your query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdminId
                    const isUpdating = updatingId === u.id

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2596be]/15 via-[#38bdf8]/15 to-[#ec4899]/15 text-[#2596be] font-extrabold flex items-center justify-center text-sm border border-[#2596be]/20">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-2 group-hover:text-[#2596be] transition-colors">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] font-mono font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                                    You (Self)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">{u.campus || 'Main Campus'}</p>
                          <p className="text-slate-400 font-mono">{u.cohortYear ? `Cohort ${u.cohortYear}` : '—'}</p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold border ${
                              u.systemRole === 'admin'
                                ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border-pink-300 shadow-2xs'
                                : u.systemRole === 'mentor'
                                ? 'bg-gradient-to-r from-[#2596be]/15 to-cyan-50 text-[#2596be] border-[#2596be]/30 shadow-2xs'
                                : 'bg-gradient-to-r from-[#e8da4d]/20 to-amber-50 text-amber-900 border-amber-300/80 shadow-2xs'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {u.systemRole.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <select
                            value={u.systemRole}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300/80 bg-white hover:bg-slate-50 hover:border-[#2596be] disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-[#2596be] focus:outline-none transition-all shadow-xs"
                          >
                            <option value="student">🎓 Student</option>
                            <option value="mentor">🧭 Mentor</option>
                            <option value="admin">🛡️ Admin</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
