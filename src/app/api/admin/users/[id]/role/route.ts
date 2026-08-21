import * as admin from '@/contracts/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.setRole)
