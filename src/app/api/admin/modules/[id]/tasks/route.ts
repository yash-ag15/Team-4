import * as admin from '@/contracts/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.createTask)
export const GET = defineRoute(admin.listTasks)
