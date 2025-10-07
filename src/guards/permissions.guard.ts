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
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!requiredPermission || requiredPermission.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userPermissions = request.user?.permissions ?? []
    if (!userPermissions?.includes(requiredPermission)) {
      throw new ForbiddenException('INSUFFICIENT_PERMISSION')
    }

    return true
  }
}
