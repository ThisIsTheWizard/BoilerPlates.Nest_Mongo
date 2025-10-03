import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

import { CommonService } from '@/common/common.service'
import { UserWithRoles } from '@/user/user.interface'
import { UserService } from '@/user/user.service'

interface AuthenticatedRequest extends Request {
  user?: {
    email: string
    roles?: string[]
    user_id: string
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private commonService: CommonService,
    private userService: UserService
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        throw new UnauthorizedException('UNAUTHORIZED')
      }

      const decoded = this.commonService.verifyJWTToken(token) as {
        user_id: string
        email: string
      }
      const { user_id, email } = decoded || {}

      const user: UserWithRoles | null = await this.userService.findOne({ where: { id: user_id } })

      req.user = {
        email,
        roles: user?.role_users?.map((ru) => ru?.role?.name),
        user_id
      }

      next()
    } catch (err) {
      console.log(err)
      throw new UnauthorizedException('UNAUTHORIZED')
    }
  }
}
