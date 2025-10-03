import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

import { RequestUser } from '@/auth/auth.interface'
import { PERMISSIONS_KEY } from '@/decorators/permissions.decorator'

interface AuthenticatedRequest extends Request {
  user?: RequestUser
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userPermissions = request.user?.permissions ?? []

    const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission))

    if (!hasAllPermissions) {
      throw new ForbiddenException('INSUFFICIENT_PERMISSION')
    }

    return true
  }
}
