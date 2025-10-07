import { Injectable } from '@nestjs/common'
import { Prisma, Role, RoleName, User } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { map } from 'lodash'

import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { CreateUserDto, UpdateUserDto } from '@/user/user.dto'

@Injectable()
export class UserService {
  constructor(
    private commonService: CommonService,
    private prismaService: PrismaService,
    private roleService: RoleService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await this.commonService.hashPassword(createUserDto.password)
    return this.prismaService.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword
      }
    })
  }

  async findAll() {
    return this.prismaService.user.findMany({
      include: {
        role_users: {
          include: {
            role: true
          }
        }
      }
    })
  }

  async findOne(options: Prisma.UserFindUniqueArgs) {
    return this.prismaService.user.findUnique({
      ...options,
      include: { ...options?.include, role_users: { include: { role: true } } }
    })
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return this.prismaService.user.update({
        where: { id },
        data: updateUserDto
      })
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        throw new Error('USER_NOT_FOUND')
      }
      throw error
    }
  }

  async seedTestUsers(roles: Role[]) {
    const adminRole = roles.find((r) => r.name === 'admin')
    const developerRole = roles.find((r) => r.name === 'developer')
    const userRole = roles.find((r) => r.name === 'user')
    if (!userRole) {
      throw new Error('USER_ROLE_NOT_FOUND')
    }

    const hashedPassword = await this.commonService.hashPassword('password')
    const usersData: Array<Prisma.UserCreateInput> = [
      {
        email: 'test-1@test.com',
        first_name: 'Test',
        last_name: 'User 1',
        password: hashedPassword,
        status: 'active'
      },
      {
        email: 'test-2@test.com',
        first_name: 'Test',
        last_name: 'User 2',
        password: hashedPassword,
        status: 'active'
      },
      {
        email: 'test-3@test.com',
        first_name: 'Test',
        last_name: 'User 3',
        password: hashedPassword,
        status: 'active'
      }
    ]

    const users: User[] = []
    for (const userData of usersData) {
      const user = await this.prismaService.user.upsert({
        where: { email: userData.email },
        update: { email: userData.email },
        create: userData
      })
      users.push(user)
    }
    const roleAssignments = map(users, (u) => ({ user_id: u.id, role_id: userRole.id! }))

    if (users[0] && adminRole) {
      roleAssignments.push({ role_id: adminRole.id, user_id: users[0].id })
    }
    if (users[1] && developerRole) {
      roleAssignments.push({ role_id: developerRole.id, user_id: users[1].id })
    }

    await this.prismaService.roleUser.createMany({ data: roleAssignments })

    return users
  }

  async remove(id: string) {
    try {
      return this.prismaService.user.delete({
        where: { id }
      })
    } catch (error: unknown) {
      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        throw new Error('USER_NOT_FOUND')
      }
      throw error
    }
  }

  async assignRole(user_id: string, role_name: string) {
    if (!Object.values(RoleName).includes(role_name as RoleName)) {
      throw new Error('INVALID_ROLE_NAME')
    }

    const role = await this.roleService.findOne({ where: { name: role_name as RoleName } })
    if (!role) {
      throw new Error('ROLE_NOT_FOUND')
    }

    try {
      return await this.prismaService.roleUser.create({
        data: {
          user_id,
          role_id: role.id
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prismaService.roleUser.findUnique({
          where: {
            user_id_role_id: {
              user_id,
              role_id: role.id
            }
          }
        })
        if (existing) {
          return existing
        }
      }
      throw error
    }
  }

  async revokeRole(user_id: string, role_name: string) {
    if (!Object.values(RoleName).includes(role_name as RoleName)) {
      throw new Error('INVALID_ROLE_NAME')
    }

    const role = await this.roleService.findOne({ where: { name: role_name as RoleName } })
    if (!role) {
      throw new Error('ROLE_NOT_FOUND')
    }

    return this.prismaService.roleUser.delete({
      where: {
        user_id_role_id: {
          user_id,
          role_id: role.id
        }
      }
    })
  }
}
