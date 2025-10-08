import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { RoleName } from '@prisma/client'
import { Request } from 'express'

import { RequestUser } from '@/auth/auth.interface'
import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'

interface AuthenticatedRequest extends Request {
  user?: RequestUser
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly commonService: CommonService,
    private readonly prismaService: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }

    try {
      const decoded = this.commonService.verifyJWTToken(token) || {}
      const { user_id } = decoded as { email?: string; user_id?: string }
      if (!user_id) {
        throw new UnauthorizedException('UNAUTHORIZED')
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: user_id },
        include: {
          role_users: {
            include: {
              role: {
                include: {
                  role_permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      })
      if (!user?.id) {
        throw new UnauthorizedException('UNAUTHORIZED')
      }

      const roles = new Set<RoleName>()
      const permissions = new Set<string>()

      user.role_users.forEach((roleUser) => {
        const role = roleUser.role
        if (!role) {
          return
        }

        roles.add(role.name)
        role.role_permissions?.forEach((rolePermission) => {
          if (!rolePermission.can_do_the_action || !rolePermission.permission) {
            return
          }

          const { action, module } = rolePermission.permission
          permissions.add(`${module}.${action}`)
        })
      })

      request.user = {
        email: user.email,
        permissions: Array.from(permissions),
        roles: Array.from(roles),
        user_id: user.id
      }

      return true
    } catch (error) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }
  }
}
