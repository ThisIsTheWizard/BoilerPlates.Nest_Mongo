import { Body, Controller, Get, Headers, Post } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { AssignRoleDto, RevokeRoleDto } from '@/auth/auth.dto'
import { AuthService } from '@/auth/auth.service'
import { User } from '@/decorators/user.decorator'
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
  @ApiBearerAuth()
  logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '')
    return this.authService.logout(token)
  }

  @Post('change-email')
  @ApiBearerAuth()
  changeEmail(@Body() changeEmailDto: ChangeEmailDto, @User('user_id') user_id: string) {
    return this.authService.changeEmail(changeEmailDto.email, user_id)
  }

  @Post('cancel-change-email')
  @ApiBearerAuth()
  cancelChangeEmail(@Body() changeEmailDto: ChangeEmailDto) {
    return this.authService.cancelChangeEmail(changeEmailDto)
  }

  @Post('verify-change-email')
  @ApiBearerAuth()
  verifyChangeEmail(@Body() verifyChangeEmailDto: VerifyChangeEmailDto, @User('user_id') user_id: string) {
    return this.authService.verifyChangeEmail(verifyChangeEmailDto, user_id)
  }

  @Post('set-user-email')
  @ApiBearerAuth()
  setUserEmail(@Body() setUserEmailDto: SetUserEmailDto) {
    return this.authService.setUserEmail(setUserEmailDto)
  }

  @Post('change-password')
  @ApiBearerAuth()
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @User('user_id') user_id: string) {
    return this.authService.changePassword(changePasswordDto, user_id)
  }

  @Post('set-user-password')
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
  @ApiBearerAuth()
  verifyUserPassword(@Body() verifyUserPasswordDto: VerifyUserPasswordDto, @User('user_id') user_id: string) {
    return this.authService.verifyUserPassword(verifyUserPasswordDto, user_id)
  }

  @Get('user')
  @ApiBearerAuth()
  getAuthUser(@User('user_id') user_id: string) {
    return this.authService.getAuthUser(user_id)
  }

  @Post('assign-role')
  @ApiBearerAuth()
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.authService.assignRole(assignRoleDto)
  }

  @Post('revoke-role')
  @ApiBearerAuth()
  revokeRole(@Body() revokeRoleDto: RevokeRoleDto) {
    return this.authService.revokeRole(revokeRoleDto)
  }
}
