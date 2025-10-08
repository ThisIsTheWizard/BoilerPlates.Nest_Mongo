import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { RoleName } from '@prisma/client'

import { Permissions } from '@/decorators/permissions.decorator'
import { Roles } from '@/decorators/roles.decorator'
import { User } from '@/decorators/user.decorator'

import { AssignRoleDto, RevokeRoleDto } from '@/auth/auth.dto'
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  SetUserEmailDto,
  SetUserPasswordDto,
  VerifyChangeEmailDto,
  VerifyEmailDto,
  VerifyForgotPasswordCodeDto,
  VerifyForgotPasswordDto,
  VerifyUserPasswordDto
} from '@/user/user.dto'

import { AuthGuard } from '@/guards/auth.guard'
import { PermissionsGuard } from '@/guards/permissions.guard'
import { RolesGuard } from '@/guards/roles.guard'

import { AuthService } from '@/auth/auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('verify-user-email')
  verifyUserEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyUserEmail(verifyEmailDto)
  }

  @Post('resend-verification-email')
  resendVerificationEmail(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendVerificationDto)
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto)
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '')
    return this.authService.logout(token)
  }

  @Post('change-email')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  changeEmail(@Body() changeEmailDto: ChangeEmailDto, @User('user_id') user_id: string) {
    return this.authService.changeEmail(changeEmailDto.email, user_id)
  }

  @Post('cancel-change-email')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  cancelChangeEmail(@Body() changeEmailDto: ChangeEmailDto) {
    return this.authService.cancelChangeEmail(changeEmailDto)
  }

  @Post('verify-change-email')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  verifyChangeEmail(@Body() verifyChangeEmailDto: VerifyChangeEmailDto, @User('user_id') user_id: string) {
    return this.authService.verifyChangeEmail(verifyChangeEmailDto, user_id)
  }

  @Post('set-user-email')
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleName.admin, RoleName.developer)
  @Permissions('user.update')
  @ApiBearerAuth()
  setUserEmail(@Body() setUserEmailDto: SetUserEmailDto) {
    return this.authService.setUserEmail(setUserEmailDto)
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @User('user_id') user_id: string) {
    return this.authService.changePassword(changePasswordDto, user_id)
  }

  @Post('set-user-password')
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleName.admin, RoleName.developer)
  @Permissions('user.update')
  @ApiBearerAuth()
  setUserPassword(@Body() setUserPasswordDto: SetUserPasswordDto) {
    return this.authService.setUserPassword(setUserPasswordDto)
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post('retry-forgot-password')
  retryForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.retryForgotPassword(forgotPasswordDto)
  }

  @Post('verify-forgot-password')
  verifyForgotPassword(@Body() verifyForgotPasswordDto: VerifyForgotPasswordDto) {
    return this.authService.verifyForgotPassword(verifyForgotPasswordDto)
  }

  @Post('verify-forgot-password-code')
  verifyForgotPasswordCode(@Body() verifyForgotPasswordCodeDto: VerifyForgotPasswordCodeDto) {
    return this.authService.verifyForgotPasswordCode(verifyForgotPasswordCodeDto)
  }

  @Post('verify-user-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  verifyUserPassword(@Body() verifyUserPasswordDto: VerifyUserPasswordDto, @User('user_id') user_id: string) {
    return this.authService.verifyUserPassword(verifyUserPasswordDto, user_id)
  }

  @Get('user')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  getAuthUser(@User('user_id') user_id: string) {
    return this.authService.getAuthUser(user_id)
  }

  @Post('assign-role')
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleName.admin, RoleName.developer)
  @Permissions('user.update')
  @ApiBearerAuth()
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.authService.assignRole(assignRoleDto)
  }

  @Post('revoke-role')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(RoleName.admin, RoleName.developer)
  @Permissions('user.update')
  @ApiBearerAuth()
  revokeRole(@Body() revokeRoleDto: RevokeRoleDto) {
    return this.authService.revokeRole(revokeRoleDto)
  }
}
