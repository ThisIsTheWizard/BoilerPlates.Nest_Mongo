import { Controller, Post } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { UserService } from '@/user/user.service'

@Controller('test')
export class TestController {
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
    private userService: UserService
  ) {}

  @Post('setup')
  async setup() {
    const collections = [
      'role_permissions',
      'role_users',
      'auth_tokens',
      'verification_tokens',
      'permissions',
      'roles',
      'users'
    ]

    for (const collection of collections) {
      await this.prisma.$runCommandRaw({
        delete: collection,
        deletes: [{ q: {}, limit: 0 }]
      })
    }

    const roles = await this.roleService.seedSystemRoles()
    const users = await this.userService.seedTestUsers(roles)

    return { roles, users }
  }
}
