import * as admin from '@/contracts/admin'
import * as adminServer from '@/server/admin'
import { defineRoute } from '@/server/route'

export const POST = defineRoute(admin.createModule, (input) => adminServer.createModule(input))
export const GET = defineRoute(admin.listModules, (input) => adminServer.listModules(input))
