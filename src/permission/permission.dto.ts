import { PermissionAction, PermissionModule } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class CreatePermissionDto {
  @IsEnum(PermissionAction)
  action: PermissionAction

  @IsEnum(PermissionModule)
  module: PermissionModule

  @IsOptional()
  @IsString()
  created_by?: string
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsEnum(PermissionAction)
  action?: PermissionAction

  @IsOptional()
  @IsEnum(PermissionModule)
  module?: PermissionModule
}
