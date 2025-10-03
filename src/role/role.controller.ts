import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'

import { CreateRoleDto, ManagePermissionDto, UpdateRoleDto } from '@/role/role.dto'
import { RoleService } from '@/role/role.service'

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() body: CreateRoleDto) {
    return this.roleService.create(body)
  }

  @Get()
  findAll() {
    return this.roleService.findAll({})
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne({ where: { id } })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.roleService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id)
  }

  @Post('permissions/assign')
  assignPermission(@Body() body: ManagePermissionDto) {
    return this.roleService.assignPermission(body)
  }

  @Post('permissions/revoke')
  revokePermission(@Body() body: ManagePermissionDto) {
    return this.roleService.revokePermission(body)
  }

  @Patch('permissions/update')
  updatePermission(@Body() body: ManagePermissionDto) {
    return this.roleService.updatePermission(body)
  }

  @Post('seed')
  seedRoles() {
    return this.roleService.seedSystemRoles()
  }
}
