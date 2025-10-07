import { Module } from '@nestjs/common'

import { CommonModule } from '@/common/common.module'
import { PermissionController } from '@/permission/permission.controller'
import { PermissionService } from '@/permission/permission.service'
import { PrismaService } from '@/prisma/prisma.service'

@Module({
  imports: [CommonModule],
  controllers: [PermissionController],
  providers: [PermissionService, PrismaService],
  exports: [PermissionService]
})
export class PermissionModule {}
