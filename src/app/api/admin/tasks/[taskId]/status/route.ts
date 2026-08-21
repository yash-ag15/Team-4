import * as admin from '@/contracts/admin'
import { defineRoute } from '@/server/route'

export const PATCH = defineRoute(admin.setTaskStatus)
