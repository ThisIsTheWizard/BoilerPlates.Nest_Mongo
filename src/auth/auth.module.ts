import { Module } from '@nestjs/common'

import { AuthTokenService } from '@/auth-token/auth-token.service'
import { AuthController } from '@/auth/auth.controller'
import { AuthService } from '@/auth/auth.service'
import { CommonService } from '@/common/common.service'
import { AuthGuard } from '@/guards/auth.guard'
import { PermissionsGuard } from '@/guards/permissions.guard'
import { RolesGuard } from '@/guards/roles.guard'
import { PrismaService } from '@/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
import { UserService } from '@/user/user.service'
import { VerificationTokenService } from '@/verification-token/verification-token.service'

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    CommonService,
    PrismaService,
    RoleService,
    UserService,
    VerificationTokenService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard
  ]
})
export class AuthModule {}
