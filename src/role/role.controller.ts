import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { RoleName } from '@prisma/client'

import { Permissions } from '@/decorators/permissions.decorator'
import { Roles } from '@/decorators/roles.decorator'
import { AuthGuard } from '@/guards/auth.guard'
import { PermissionsGuard } from '@/guards/permissions.guard'
import { RolesGuard } from '@/guards/roles.guard'

import { CreateRoleDto, ManagePermissionDto, UpdateRoleDto } from '@/role/role.dto'
import { RoleService } from '@/role/role.service'

@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleName.admin, RoleName.developer)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('role.create')
  create(@Body() body: CreateRoleDto) {
    return this.roleService.create(body)
  }

  @Get()
  @Permissions('role.read')
  findAll() {
    return this.roleService.findAll({})
  }

  @Get(':id')
  @Permissions('role.read')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne({ where: { id } })
  }

  @Patch(':id')
  @Permissions('role.update')
  update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.roleService.update(id, body)
  }

  @Delete(':id')
  @Permissions('role.delete')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id)
  }

  @Post('permissions/assign')
  @Permissions('role_permission.create')
  assignPermission(@Body() body: ManagePermissionDto) {
    return this.roleService.assignPermission(body)
  }

  @Post('permissions/revoke')
  @Permissions('role_permission.delete')
  revokePermission(@Body() body: ManagePermissionDto) {
    return this.roleService.revokePermission(body)
  }

  @Patch('permissions/update')
  @Permissions('role_permission.update')
  updatePermission(@Body() body: ManagePermissionDto) {
    return this.roleService.updatePermission(body)
  }

  @Post('seed')
  @Permissions('role.create')
  seedRoles() {
    return this.roleService.seedSystemRoles()
  }
}
