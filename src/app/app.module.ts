import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Controllers
import { AppController } from '@/app/app.controller'
import { TestController } from '@/test/test.controller'

// Middlewares
import { AuthMiddleware } from '@/middleware/auth.middleware'

// Modules
import { AuthModule } from '@/auth/auth.module'
import { PermissionModule } from '@/permission/permission.module'
import { RoleModule } from '@/role/role.module'
import { UserModule } from '@/user/user.module'

// Services
import { AppService } from '@/app/app.service'
import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UserModule, RoleModule, PermissionModule],
  controllers: [AppController, TestController],
  providers: [AppService, PrismaService, AuthMiddleware, CommonService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { method: RequestMethod.GET, path: '/' },
        { method: RequestMethod.POST, path: 'auth/login' },
        { method: RequestMethod.POST, path: 'auth/forgot-password' },
        { method: RequestMethod.POST, path: 'auth/retry-forgot-password' },
        { method: RequestMethod.POST, path: 'auth/verify-forgot-password' },
        { method: RequestMethod.POST, path: 'auth/verify-forgot-password-code' },
        { method: RequestMethod.POST, path: 'auth/refresh-token' },
        { method: RequestMethod.POST, path: 'auth/register' },
        { method: RequestMethod.POST, path: 'auth/resend-verification-email' },
        { method: RequestMethod.POST, path: 'auth/verify-user-email' },
        { method: RequestMethod.POST, path: 'test/setup' }
      )
      .forRoutes('*')
  }
}
