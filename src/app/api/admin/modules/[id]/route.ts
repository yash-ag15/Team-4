import * as admin from '@/contracts/admin'
import { defineRoute } from '@/server/route'

export const GET = defineRoute(admin.getModule)
export const PUT = defineRoute(admin.updateModule)
