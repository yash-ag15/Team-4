import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { auth } from '../lib/auth'

async function testSignUp() {
  console.log('Testing email sign up via Better Auth API...')
  const testEmail = `testuser_${Date.now()}@example.com`
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: 'Password123!',
        name: 'Test Account',
      },
    })
    console.log('✅ Sign up successful! User created:', res.user.id, res.user.email)
  } catch (err: any) {
    console.error('❌ Sign up failed:', err)
  }
}

testSignUp()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
