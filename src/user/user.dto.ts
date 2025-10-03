import { IsPassword } from '@/decorators/password.decorator'
import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator'

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  first_name?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  last_name?: string

  @ApiProperty()
  @IsPassword()
  password: string
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  token: string
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  password: string
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  access_token: string

  @ApiProperty()
  @IsString()
  refresh_token: string
}

export class ChangeEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string
}

export class VerifyChangeEmailDto {
  @ApiProperty()
  @IsString()
  token: string
}

export class SetUserEmailDto {
  @ApiProperty()
  @IsEmail()
  new_email: string

  @ApiProperty()
  @IsUUID()
  user_id: string
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsPassword()
  new_password: string

  @ApiProperty()
  @IsString()
  old_password: string
}

export class SetUserPasswordDto {
  @ApiProperty()
  @IsPassword()
  password: string

  @ApiProperty()
  @IsUUID()
  user_id: string
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string
}

export class VerifyForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsPassword()
  password: string

  @ApiProperty()
  @IsString()
  token: string
}

export class VerifyForgotPasswordCodeDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  token: string
}

export class VerifyUserPasswordDto {
  @ApiProperty()
  @IsString()
  password: string
}

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  first_name?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  last_name?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  new_email?: string

  @ApiProperty()
  @IsPassword()
  password: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone_number?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'invited' | 'unverified'
}

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  first_name?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  last_name?: string

  @IsOptional()
  @IsString()
  new_email?: string | null

  @ApiProperty()
  @IsOptional()
  @IsString()
  password?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone_number?: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'invited' | 'unverified'
}
