import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { RoleName } from '@prisma/client'

import { Permissions } from '@/decorators/permissions.decorator'
import { Roles } from '@/decorators/roles.decorator'
import { AuthGuard } from '@/guards/auth.guard'
import { PermissionsGuard } from '@/guards/permissions.guard'
import { RolesGuard } from '@/guards/roles.guard'
import { CreatePermissionDto, UpdatePermissionDto } from '@/permission/permission.dto'
import { PermissionService } from '@/permission/permission.service'

@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleName.admin, RoleName.developer)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Permissions('permission.create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto)
  }

  @Get()
  @Permissions('permission.read')
  findAll() {
    return this.permissionService.findAll()
  }

  @Get(':id')
  @Permissions('permission.read')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id)
  }

  @Patch(':id')
  @Permissions('permission.update')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(id, updatePermissionDto)
  }

  @Delete(':id')
  @Permissions('permission.delete')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id)
  }

  @Post('seed')
  @Permissions('permission.create')
  seedPermissions() {
    return this.permissionService.seedPermissions()
  }
}
