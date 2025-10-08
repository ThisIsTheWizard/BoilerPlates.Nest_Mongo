import { RoleName } from '@prisma/client'
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'

export class CreateRoleDto {
  @IsEnum(RoleName)
  name: RoleName

  @IsOptional()
  @IsString()
  created_by?: string
}

export class UpdateRoleDto {
  @IsOptional()
  @IsEnum(RoleName)
  name?: RoleName
}

export class AssignRoleDto {
  @IsString()
  user_id: string

  @IsEnum(RoleName)
  role_name: RoleName
}

export class ManagePermissionDto {
  @IsOptional()
  @IsBoolean()
  can_do_the_action?: boolean

  @IsString()
  permission_id: string

  @IsString()
  role_id: string
}
