import { Module } from '@nestjs/common'

import { AuthTokenService } from '@/auth-token/auth-token.service'
import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'
import { RoleModule } from '@/role/role.module'
import { UserController } from '@/user/user.controller'
import { UserService } from '@/user/user.service'
import { VerificationTokenService } from '@/verification-token/verification-token.service'

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, CommonService, AuthTokenService, VerificationTokenService],
  exports: [UserService]
})
export class UserModule {}
