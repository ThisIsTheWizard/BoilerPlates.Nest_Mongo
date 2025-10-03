import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import { CreatePermissionDto, UpdatePermissionDto } from '@/permission/permission.dto'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePermissionDto) {
    return this.prisma.permission.create({ data })
  }

  async findAll() {
    return this.prisma.permission.findMany()
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } })
    if (!permission) {
      throw new NotFoundException('Permission not found')
    }

    return permission
  }

  async update(id: string, data: UpdatePermissionDto) {
    try {
      return await this.prisma.permission.update({ where: { id }, data })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Permission not found')
      }
      throw error
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.permission.delete({ where: { id } })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Permission not found')
      }
      throw error
    }
  }

  async seedPermissions() {
    const modules: Array<'user' | 'role' | 'permission' | 'role_user' | 'role_permission'> = [
      'user',
      'role',
      'permission',
      'role_user',
      'role_permission'
    ]
    const actions: Array<'create' | 'read' | 'update' | 'delete'> = ['create', 'read', 'update', 'delete']

    const permissions = await Promise.all(
      modules.flatMap((module) =>
        actions.map(async (action) => {
          try {
            return await this.prisma.permission.create({ data: { action, module } })
          } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
              return this.prisma.permission.findUnique({
                where: {
                  action_module: {
                    action,
                    module
                  }
                }
              })
            }
            throw error
          }
        })
      )
    )

    return permissions.filter((permission): permission is NonNullable<typeof permission> => Boolean(permission))
  }
}
