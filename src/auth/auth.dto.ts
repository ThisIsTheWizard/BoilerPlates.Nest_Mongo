import { IsNotEmpty, IsString } from 'class-validator'

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  user_id: string

  @IsString()
  @IsNotEmpty()
  role_id: string
}

export class RevokeRoleDto {
  @IsString()
  @IsNotEmpty()
  user_id: string

  @IsString()
  @IsNotEmpty()
  role_id: string
}
