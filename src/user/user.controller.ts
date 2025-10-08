import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { Permissions } from '@/decorators/permissions.decorator'
import { Roles } from '@/decorators/roles.decorator'
import { AuthGuard } from '@/guards/auth.guard'
import { PermissionsGuard } from '@/guards/permissions.guard'
import { RolesGuard } from '@/guards/roles.guard'
import { CreateUserDto, UpdateUserDto } from '@/user/user.dto'
import { UserService } from '@/user/user.service'
import { RoleName } from '@prisma/client'

@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleName.admin, RoleName.developer)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBearerAuth()
  @Permissions('user.create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Get()
  @ApiBearerAuth()
  @Permissions('user.read')
  findAll() {
    return this.userService.findAll()
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions('user.read')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND')
    }
    return user
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions('user.update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions('user.delete')
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}
