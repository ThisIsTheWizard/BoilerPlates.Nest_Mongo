import { Controller, Post } from '@nestjs/common'

import { PermissionAction, PermissionModule, RoleName } from '@prisma/client'

import { PermissionService } from '@/permission/permission.service'
import { PrismaService } from '@/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { UserService } from '@/user/user.service'

@Controller('test')
export class TestController {
  constructor(
    private permissionService: PermissionService,
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
      await this.prisma.$runCommandRaw({ delete: collection, deletes: [{ q: {}, limit: 0 }] })
    }

    const roles = await this.roleService.seedSystemRoles()
    const permissions = await this.permissionService.seedPermissions()

    await this.seedRolePermissions(roles, permissions)

    const users = await this.userService.seedTestUsers(roles)

    return { roles, users }
  }

  private async seedRolePermissions(
    roles: Awaited<ReturnType<typeof this.roleService.seedSystemRoles>>,
    permissions: Awaited<ReturnType<typeof this.permissionService.seedPermissions>>
  ) {
    const permissionByKey = new Map<string, (typeof permissions)[number]>()
    permissions.forEach((permission) => {
      permissionByKey.set(`${permission.module}:${permission.action}`, permission)
    })

    const roleByName = new Map<RoleName, (typeof roles)[number]>()
    roles.forEach((role) => {
      if (role) {
        roleByName.set(role.name, role)
      }
    })

    const userManagementPermissions: Array<{ module: PermissionModule; action: PermissionAction }> = [
      { module: PermissionModule.user, action: PermissionAction.create },
      { module: PermissionModule.user, action: PermissionAction.read },
      { module: PermissionModule.user, action: PermissionAction.update },
      { module: PermissionModule.user, action: PermissionAction.delete }
    ]

    const privilegedRoles: RoleName[] = [RoleName.admin, RoleName.developer]

    for (const roleName of privilegedRoles) {
      const role = roleByName.get(roleName)
      if (!role?.id) {
        continue
      }

      await Promise.all(
        userManagementPermissions.map(async ({ module, action }) => {
          const permission = permissionByKey.get(`${module}:${action}`)
          if (!permission?.id) {
            return
          }

          await this.roleService.assignPermission({
            role_id: role.id,
            permission_id: permission.id,
            can_do_the_action: true
          })
        })
      )
    }
  }
}
