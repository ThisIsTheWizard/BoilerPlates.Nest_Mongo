import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

// Controllers
import { AppController } from '@/app/app.controller'

// Modules
import { AuthModule } from '@/auth/auth.module'
import { PermissionModule } from '@/permission/permission.module'
import { RoleModule } from '@/role/role.module'
import { UserModule } from '@/user/user.module'

// Services
import { AppService } from '@/app/app.service'
import { CommonModule } from '@/common/common.module'
import { PrismaService } from '@/prisma/prisma.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})
export class AppModule {}
