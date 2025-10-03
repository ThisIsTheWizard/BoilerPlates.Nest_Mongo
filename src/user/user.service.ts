import { Injectable } from '@nestjs/common'
import { Prisma, Role, RoleName } from '@prisma/client'
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
    const roleLookup = roles.reduce<Record<RoleName, Role | undefined>>(
      (acc, role) => {
        acc[role.name] = role
        return acc
      },
      {} as Record<RoleName, Role | undefined>
    )

    const userRole = roleLookup[RoleName.user]
    const hashedPassword = await this.commonService.hashPassword('password')
    const userData: Array<Prisma.UserCreateInput> = [
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

    const additionalRoleAssignments: Record<string, RoleName[]> = {
      'test-1@test.com': [RoleName.admin],
      'test-2@test.com': [RoleName.developer]
    }

    const users = await Promise.all(
      userData.map(async (data) => {
        try {
          return await this.prismaService.user.create({ data })
        } catch (error) {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return this.prismaService.user.findUnique({ where: { email: data.email } })
          }
          throw error
        }
      })
    )

    if (userRole?.id) {
      await Promise.all(
        map(users, async (user) => {
          if (!user?.id) {
            return
          }
          try {
            await this.prismaService.roleUser.create({ data: { user_id: user.id, role_id: userRole.id } })
          } catch (error) {
            if (!(error instanceof PrismaClientKnownRequestError && error.code === 'P2002')) {
              throw error
            }
          }
        })
      )
    }

    await Promise.all(
      map(users, async (user) => {
        if (!user?.id) {
          return
        }

        const extraRoles = additionalRoleAssignments[user.email] ?? []

        await Promise.all(
          extraRoles.map(async (roleName) => {
            const role = roleLookup[roleName]
            if (!role?.id) {
              return
            }

            try {
              await this.prismaService.roleUser.create({
                data: {
                  role_id: role.id,
                  user_id: user.id
                }
              })
            } catch (error) {
              if (!(error instanceof PrismaClientKnownRequestError && error.code === 'P2002')) {
                throw error
              }
            }
          })
        )
      })
    )

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
