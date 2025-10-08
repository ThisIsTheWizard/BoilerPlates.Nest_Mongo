import { api, prisma } from './setup'
import * as bcrypt from 'bcryptjs'

export interface TestUser {
  id: string
  email: string
  password: string
  accessToken: string
  refreshToken: string
}

export interface TestFixtures {
  adminUser: TestUser
  regularUser: TestUser
  roles: {
    admin: { id: string; name: string }
    user: { id: string; name: string }
    moderator: { id: string; name: string }
    developer: { id: string; name: string }
  }
  permissions: Array<{ id: string; action: string; module: string }>
}

export async function createTestFixtures(): Promise<TestFixtures> {
  // Seed roles and permissions first
  await seedRolesAndPermissions()

  // Get roles
  const roles = {
    admin: await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } }),
    user: await prisma.role.findUniqueOrThrow({ where: { name: 'user' } }),
    moderator: await prisma.role.findUniqueOrThrow({ where: { name: 'moderator' } }),
    developer: await prisma.role.findUniqueOrThrow({ where: { name: 'developer' } })
  }

  // Get permissions
  const permissions = await prisma.permission.findMany()

  // Create admin user
  const adminUser = await createUserWithRole('admin@test.com', 'Admin123!@#', roles.admin.id)
  
  // Create regular user
  const regularUser = await createUserWithRole('user@test.com', 'User123!@#', roles.user.id)

  return {
    adminUser,
    regularUser,
    roles,
    permissions
  }
}

async function seedRolesAndPermissions() {
  // Create roles
  const roleNames = ['admin', 'user', 'moderator', 'developer'] as const
  
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  // Create permissions
  const modules = ['user', 'role', 'permission', 'role_user', 'role_permission'] as const
  const actions = ['create', 'read', 'update', 'delete'] as const

  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { action_module: { action, module } },
        update: {},
        create: { action, module }
      })
    }
  }

  // Assign permissions to admin role
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } })
  const allPermissions = await prisma.permission.findMany()

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id
        }
      },
      update: { can_do_the_action: true },
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
        can_do_the_action: true
      }
    })
  }
}

async function createUserWithRole(email: string, password: string, roleId: string): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Create user
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      status: 'active'
    },
    create: {
      email,
      password: hashedPassword,
      status: 'active',
      first_name: 'Test',
      last_name: 'User'
    }
  })

  // Assign role
  await prisma.roleUser.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: roleId
      }
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: roleId
    }
  })

  // Wait a bit for the server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Login to get tokens
  try {
    const loginResponse = await api.post('/auth/login', {
      email,
      password
    })

    if (loginResponse.status !== 201) {
      console.error(`Login failed for ${email}:`, loginResponse.status, loginResponse.data)
      throw new Error(`Failed to login user ${email}: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`)
    }

    return {
      id: user.id,
      email,
      password,
      accessToken: loginResponse.data.access_token,
      refreshToken: loginResponse.data.refresh_token
    }
  } catch (error) {
    console.error(`Error during login for ${email}:`, error)
    throw error
  }
}

export async function cleanupTestData() {
  // Clean up in reverse dependency order
  await prisma.authToken.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.roleUser.deleteMany()
  await prisma.user.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
}