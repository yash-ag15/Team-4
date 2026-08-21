import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import * as adminServer from '../server/admin'
import * as coursesServer from '../server/courses'

async function runTests() {
  console.log('==========================================')
  console.log('Testing Admin & Course Backend APIs (Live)')
  console.log('==========================================\n')

  let passed = 0
  let failed = 0

  async function test(name: string, fn: () => Promise<any>) {
    try {
      const res = await fn()
      console.log(`✅ [PASS] ${name}`)
      passed++
      return res
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err)
      failed++
    }
  }

  // 1. Courses list
  await test('courses.listCourses()', async () => {
    const res = await coursesServer.listCourses({ limit: 10 })
    if (!Array.isArray(res.courses)) throw new Error('Expected courses array')
    console.log(`   -> Found ${res.courses.length} courses`)
    return res
  })

  // 2. Admin listCourses
  await test('adminServer.listCourses()', async () => {
    const res = await adminServer.listCourses({ limit: 10 })
    if (!Array.isArray(res.courses)) throw new Error('Expected courses array')
    console.log(`   -> Found ${res.courses.length} admin courses`)
    return res
  })

  // 3. Admin listModules
  await test('adminServer.listModules()', async () => {
    const res = await adminServer.listModules({ limit: 10 })
    if (!Array.isArray(res.modules)) throw new Error('Expected modules array')
    console.log(`   -> Found ${res.modules.length} modules`)
    return res
  })

  // 4. Admin getReport
  await test('adminServer.getReport()', async () => {
    const res = await adminServer.getReport({})
    if (!Array.isArray(res.rows) || !res.totals) throw new Error('Invalid report structure')
    console.log(`   -> Report totals: ${JSON.stringify(res.totals)}`)
    return res
  })

  // 5. Admin listUsers
  await test('adminServer.listUsers()', async () => {
    const res = await adminServer.listUsers({ limit: 10 })
    if (!Array.isArray(res.users)) throw new Error('Expected users array')
    console.log(`   -> Found ${res.users.length} users`)
    return res
  })

  // 6. Admin listStudents
  await test('adminServer.listStudents()', async () => {
    const res = await adminServer.listStudents({ limit: 10 })
    if (!Array.isArray(res.students)) throw new Error('Expected students array')
    console.log(`   -> Found ${res.students.length} students with aggregates/flags`)
    return res
  })

  // 7. Admin listEvaluations
  await test('adminServer.listEvaluations()', async () => {
    const res = await adminServer.listEvaluations({ limit: 10 })
    if (!Array.isArray(res.evaluations)) throw new Error('Expected evaluations array')
    console.log(`   -> Found ${res.evaluations.length} evaluations`)
    return res
  })

  // 8. Admin Content listing (if any module/course exists)
  const coursesList = await adminServer.listCourses({ limit: 1 })
  if (coursesList.courses.length > 0) {
    const courseId = coursesList.courses[0].id
    await test(`adminServer.listTasks({ id: '${courseId}' })`, async () => {
      const res = await adminServer.listTasks({ id: courseId })
      console.log(`   -> Found ${res.tasks.length} tasks for course ${courseId}`)
      return res
    })
  }

  console.log('\n==========================================')
  console.log(`Summary: ${passed} passed, ${failed} failed`)
  console.log('==========================================')
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test script crashed:', e)
    process.exit(1)
  })
