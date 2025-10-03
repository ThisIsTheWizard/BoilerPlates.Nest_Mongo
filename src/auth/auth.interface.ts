import { RoleName } from '@prisma/client'

export interface RequestUser {
  email: string
  permissions: string[]
  roles: RoleName[]
  user_id: string
}
