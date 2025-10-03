import { Injectable } from '@nestjs/common'

import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AuthTokenService {
  constructor(
    private commonService: CommonService,
    private prisma: PrismaService
  ) {}

  async countAuthTokens(options: Prisma.AuthTokenCountArgs) {
    return this.prisma.authToken.count(options)
  }

  async createAuthToken(options: Prisma.AuthTokenCreateArgs) {
    return this.prisma.authToken.create(options)
  }

  async createAuthTokensForUser(params: { email: string; roles: string[]; user_id: string }) {
    const { email, roles, user_id } = params || {}

    const access_token = this.commonService.generateJWTToken({ email, roles, sub: user_id, user_id })
    const refresh_token = this.commonService.generateJWTToken({ sub: user_id, user_id })

    const authToken = await this.createAuthToken({ data: { access_token, refresh_token, user_id } })
    if (!authToken?.id) {
      throw new Error('COULD_NOT_CREATE_AUTH_TOKEN')
    }

    return { access_token, refresh_token }
  }

  async deleteAuthToken(options: Prisma.AuthTokenDeleteArgs) {
    return this.prisma.authToken.delete(options)
  }

  async deleteAuthTokens(options: Prisma.AuthTokenDeleteManyArgs) {
    return this.prisma.authToken.deleteMany(options)
  }

  async getAuthToken(options: Prisma.AuthTokenFindUniqueArgs) {
    return this.prisma.authToken.findUnique(options)
  }

  async getAuthTokens(options: Prisma.AuthTokenFindManyArgs) {
    return this.prisma.authToken.findMany(options)
  }
}
