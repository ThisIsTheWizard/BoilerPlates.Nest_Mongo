import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import type { Role } from '@prisma/client'
import { Prisma, RoleName } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRoleDto, ManagePermissionDto, UpdateRoleDto } from './role.dto'

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateRoleDto) {
    try {
      return await this.prisma.role.create({ data: params })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('ROLE_ALREADY_EXISTS')
      }
      throw error
    }
  }

  async findAll(options: Prisma.RoleFindManyArgs) {
    if (!options.include) {
      options.include = {
        role_permissions: { include: { permission: true } },
        role_users: { include: { user: true } }
      }
    }

    return this.prisma.role.findMany(options)
  }

  async findOne(options: Prisma.RoleFindUniqueArgs) {
    if (!options.include) {
      options.include = {
        role_permissions: { include: { permission: true } },
        role_users: { include: { user: true } }
      }
    }

    try {
      const role = await this.prisma.role.findUnique(options)
      if (!role) {
        throw new NotFoundException('ROLE_NOT_FOUND')
      }
      return role
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && ['P2023', 'P2025'].includes(error.code)) {
        throw new BadRequestException('INVALID_ROLE_ID')
      }
      throw error
    }
  }

  async update(id: string, params: UpdateRoleDto) {
    try {
      return await this.prisma.role.update({ data: params, where: { id } })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('ROLE_NOT_FOUND')
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('ROLE_NAME_ALREADY_EXISTS')
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2023') {
        throw new BadRequestException('INVALID_ROLE_ID')
      }
      throw error
    }
  }

  async seedSystemRoles() {
    const roleNames: RoleName[] = ['admin', 'developer', 'moderator', 'user']

    const roles = await Promise.all(
      roleNames.map(async (name) => {
        try {
          return await this.prisma.role.create({ data: { name } })
        } catch (error) {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return this.prisma.role.findUnique({ where: { name } })
          }
          throw error
        }
      })
    )

    return roles.filter((role): role is Role => Boolean(role))
  }

  async remove(id: string) {
    try {
      // Delete related records first to avoid foreign key constraint violations
      await this.prisma.rolePermission.deleteMany({ where: { role_id: id } })
      await this.prisma.roleUser.deleteMany({ where: { role_id: id } })

      return await this.prisma.role.delete({ where: { id } })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('ROLE_NOT_FOUND')
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2023') {
        throw new BadRequestException('INVALID_ROLE_ID')
      }
      throw error
    }
  }

  async assignPermission(params: ManagePermissionDto) {
    const { can_do_the_action = false, permission_id, role_id } = params || {}

    // Verify role exists
    const role = await this.prisma.role.findUnique({ where: { id: role_id } })
    if (!role) {
      throw new NotFoundException('ROLE_NOT_FOUND')
    }

    // Verify permission exists
    const permission = await this.prisma.permission.findUnique({ where: { id: permission_id } })
    if (!permission) {
      throw new NotFoundException('PERMISSION_NOT_FOUND')
    }

    try {
      return await this.prisma.rolePermission.create({
        data: {
          can_do_the_action,
          permission_id,
          role_id
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.rolePermission.update({
          data: { can_do_the_action },
          where: {
            role_id_permission_id: {
              permission_id,
              role_id
            }
          }
        })
      }
      throw error
    }
  }

  async revokePermission(params: ManagePermissionDto) {
    const { permission_id, role_id } = params || {}

    try {
      return await this.prisma.rolePermission.delete({
        where: {
          role_id_permission_id: {
            permission_id,
            role_id
          }
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        // Return success even if the assignment doesn't exist (idempotent operation)
        return { message: 'PERMISSION_REVOKED_OR_NOT_ASSIGNED' }
      }
      throw error
    }
  }

  async updatePermission(params: ManagePermissionDto) {
    const { can_do_the_action = false, permission_id, role_id } = params || {}

    try {
      return await this.prisma.rolePermission.update({
        data: { can_do_the_action },
        where: {
          role_id_permission_id: {
            permission_id,
            role_id
          }
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('ROLE_PERMISSION_ASSIGNMENT_NOT_FOUND')
      }
      throw error
    }
  }
}
