import { Module } from '@nestjs/common'

import { CommonModule } from '../common/common.module'
import { PrismaService } from '../prisma/prisma.service'
import { RoleController } from './role.controller'
import { RoleService } from './role.service'

@Module({
  imports: [CommonModule],
  controllers: [RoleController],
  providers: [RoleService, PrismaService],
  exports: [RoleService]
})
export class RoleModule {}
