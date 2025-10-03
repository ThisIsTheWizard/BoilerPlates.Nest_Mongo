import { Permission, PermissionAction, PermissionModule, PrismaClient, RoleName } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const roleNames: RoleName[] = ['admin', 'user', 'moderator', 'developer']

  const roles = await Promise.all(
    roleNames.map(async (name) => {
      try {
        return await prisma.role.create({ data: { name } })
      } catch (error) {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return prisma.role.findUnique({ where: { name } })
        }
        throw error
      }
    })
  )
  const existingRoles = roles.filter((role): role is NonNullable<typeof role> => Boolean(role))

  // Create permissions for all modules and actions
  const modules: PermissionModule[] = ['user', 'role', 'permission', 'role_user', 'role_permission']
  const actions: PermissionAction[] = ['create', 'read', 'update', 'delete']

  const permissions: Array<Permission | null> = []
  for (const module of modules) {
    for (const action of actions) {
      const permission = await prisma.permission
        .create({ data: { action, module } })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return prisma.permission.findUnique({
              where: {
                action_module: {
                  action,
                  module
                }
              }
            })
          }
          throw error
        })
      permissions.push(permission)
    }
  }

  // Define role permissions
  const existingPermissions = permissions.filter((permission): permission is Permission => Boolean(permission))

  const rolePermissions = {
    admin: existingPermissions.map((p) => ({ permission_id: p.id, can_do_the_action: true })),
    moderator: existingPermissions
      .filter(
        (p) =>
          (p.module === 'user' && ['read', 'update'].includes(p.action)) ||
          (p.module === 'role' && p.action === 'read') ||
          (p.module === 'permission' && p.action === 'read')
      )
      .map((p) => ({ permission_id: p.id, can_do_the_action: true })),
    developer: existingPermissions
      .filter(
        (p) =>
          (p.module === 'user' && p.action === 'read') ||
          (p.module === 'role' && p.action === 'read') ||
          (p.module === 'permission' && p.action === 'read')
      )
      .map((p) => ({ permission_id: p.id, can_do_the_action: true })),
    user: existingPermissions
      .filter((p) => p.module === 'user' && p.action === 'read')
      .map((p) => ({ permission_id: p.id, can_do_the_action: true }))
  }

  // Assign permissions to roles
  for (const [role_name, rolePerms] of Object.entries(rolePermissions)) {
    const role = existingRoles.find((r) => r.name === role_name)
    if (role) {
      for (const { permission_id, can_do_the_action } of rolePerms) {
        try {
          await prisma.rolePermission.create({
            data: {
              can_do_the_action,
              permission_id,
              role_id: role.id
            }
          })
        } catch (error) {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            await prisma.rolePermission.update({
              where: {
                role_id_permission_id: {
                  permission_id,
                  role_id: role.id
                }
              },
              data: { can_do_the_action }
            })
          } else {
            throw error
          }
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
