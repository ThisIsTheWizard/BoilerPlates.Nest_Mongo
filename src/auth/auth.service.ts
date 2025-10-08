import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { pick } from 'lodash'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import { TokenResponse } from '@/auth-token/auth-token.interface'
import { AuthTokenService } from '@/auth-token/auth-token.service'
import { AssignRoleDto, RevokeRoleDto } from '@/auth/auth.dto'
import { MessageResponse } from '@/common/common.interface'
import { CommonService } from '@/common/common.service'
import { PrismaService } from '@/prisma/prisma.service'
import { RoleService } from '@/role/role.service'
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
import { UserResponse, UserWithRoles } from '@/user/user.interface'
import { UserService } from '@/user/user.service'
import { VerificationTokenService } from '@/verification-token/verification-token.service'

@Injectable()
export class AuthService {
  // eslint-disable-next-line max-params
  constructor(
    private authTokenService: AuthTokenService,
    private commonService: CommonService,
    private prismaService: PrismaService,
    private roleService: RoleService,
    private verificationTokenService: VerificationTokenService,
    private userService: UserService
  ) {}

  async register(registerDto: RegisterDto): Promise<UserResponse> {
    try {
      const hashedPassword = await this.commonService.hashPassword(registerDto.password)

      const user = await this.prismaService.user.create({
        data: {
          ...registerDto,
          password: hashedPassword
        }
      })

      // Assign default user role
      try {
        const userRole = await this.roleService.findOne({ where: { name: 'user' } })
        if (userRole) {
          await this.prismaService.roleUser.create({
            data: {
              user_id: user.id,
              role_id: userRole.id
            }
          })
        }
      } catch (error) {
        // If user role doesn't exist, continue without assigning a role
        console.warn('User role not found, skipping role assignment')
      }

      await this.verificationTokenService.createVerificationToken({
        data: {
          email: user.email,
          expired_at: new Date(Date.now() + 1000 * 5 * 60), // 5 minutes
          token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          type: 'user_verification',
          user_id: user.id
        }
      })

      return pick(user, ['id', 'email', 'first_name', 'last_name', 'status'])
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('EMAIL_ALREADY_EXISTS')
      }
      throw error
    }
  }

  async verifyUserEmail(params: VerifyEmailDto): Promise<UserResponse> {
    const { email, token } = params || {}

    const verificationToken = await this.verificationTokenService.getVerificationToken({
      where: { email, token, type: 'user_verification', status: 'unverified' }
    })
    if (!verificationToken?.id) {
      throw new BadRequestException('INVALID_TOKEN')
    }

    const user = await this.prismaService.user.update({
      where: { email },
      data: { status: 'active' }
    })

    await this.verificationTokenService.updateVerificationToken(verificationToken.id, { status: 'verified' })

    return { id: user.id, email: user.email, status: user.status }
  }

  async resendVerificationEmail(resendVerificationDto: ResendVerificationDto): Promise<MessageResponse> {
    const { email } = resendVerificationDto

    const user = await this.userService.findOne({ where: { email } })
    if (!user?.id) {
      throw new NotFoundException('USER_DOES_NOT_EXIST')
    }

    return { message: 'VERIFICATION_EMAIL_SENT', success: true }
  }

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    try {
      const user: UserWithRoles | null = await this.userService.findOne({
        where: { email: loginDto.email }
      })
      if (!user?.id) {
        throw new UnauthorizedException('USER_DOES_NOT_EXIST')
      }
      if (!(await this.commonService.comparePassword(loginDto.password, user?.password || ''))) {
        throw new UnauthorizedException('INVALID_CREDENTIALS')
      }

      return this.authTokenService.createAuthTokensForUser({
        email: user.email,
        roles: user.role_users?.map((ru) => ru.role.name) || [],
        user_id: user.id
      })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      const { access_token, refresh_token } = refreshTokenDto

      const authToken = await this.authTokenService.findFirstAuthToken({ where: { access_token, refresh_token } })
      if (!authToken?.id) {
        throw new UnauthorizedException('INVALID_TOKEN')
      }

      const user: UserWithRoles | null = await this.userService.findOne({ where: { id: authToken.user_id } })
      if (!user?.id) {
        throw new NotFoundException('USER_NOT_FOUND')
      }

      await this.authTokenService.deleteAuthToken({ where: { id: authToken.id } })

      return this.authTokenService.createAuthTokensForUser({
        email: user.email,
        roles: user.role_users?.map((ru) => ru.role.name) || [],
        user_id: user.id
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      throw error
    }
  }

  async logout(token?: string): Promise<MessageResponse> {
    if (!token) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }

    await this.authTokenService.deleteAuthTokens({ where: { access_token: token } })
    return { message: 'USER_LOGGED_OUT', success: true }
  }

  async changeEmail(email: string, user_id: string): Promise<UserResponse> {
    if (!email || !user_id) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }
    if (!this.commonService.validateEmail(email)) {
      throw new Error('EMAIL_IS_INVALID')
    }

    const existingUser = await this.prismaService.user.findFirst({
      where: { OR: [{ email }, { new_email: email }] }
    })
    if (existingUser?.id) {
      throw new Error('NEW_EMAIL_IS_ALREADY_ASSOCIATED_WITH_A_USER')
    }

    const user = await this.userService.findOne({ where: { id: user_id } })
    if (!user?.id) {
      throw new Error('USER_DOES_NOT_EXIST')
    }
    if (!(user?.status === 'active')) {
      throw new Error(`USER_IS_${user.status.toUpperCase()}`)
    }

    await this.prismaService.user.update({
      where: { id: user_id },
      data: { new_email: email }
    })

    // Delete existing verification tokens and create new one
    await this.verificationTokenService.deleteVerificationTokens({
      where: { email, type: 'user_verification', user_id }
    })
    await this.verificationTokenService.createVerificationToken({
      data: {
        email,
        expired_at: new Date(Date.now() + 1000 * 5 * 60), // 5 minutes
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        type: 'user_verification',
        user_id
      }
    })

    return pick(user, ['id', 'email', 'first_name', 'last_name', 'status'])
  }

  async cancelChangeEmail(changeEmailDto: ChangeEmailDto): Promise<MessageResponse> {
    const { email } = changeEmailDto

    const user = await this.prismaService.user.findFirst({
      where: { new_email: email }
    })
    if (!user) {
      throw new Error('NO_CHANGE_EMAIL_REQUEST_IS_FOUND')
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { new_email: null }
    })

    return { message: 'EMAIL_CHANGE_CANCELLED', success: true }
  }

  async verifyChangeEmail(params: VerifyChangeEmailDto, user_id: string): Promise<UserResponse> {
    const { token } = params || {}

    const verificationToken = await this.verificationTokenService.getVerificationToken({
      where: { token, type: 'user_verification', user_id, status: 'unverified' }
    })
    if (!verificationToken?.id) {
      throw new Error('INVALID_TOKEN')
    }

    const user = await this.userService.findOne({ where: { id: user_id } })
    if (!user?.id) {
      throw new Error('USER_DOES_NOT_EXIST')
    }
    if (user.status !== 'active') {
      throw new Error(`USER_IS_${user.status.toUpperCase()}`)
    }

    const updatedUser = await this.userService.update(user_id, {
      email: user.new_email!,
      new_email: null
    })

    await this.verificationTokenService.updateVerificationToken(verificationToken.id, { status: 'verified' })

    return pick(updatedUser, ['id', 'email', 'first_name', 'last_name', 'status'])
  }

  async setUserEmail(setUserEmailDto: SetUserEmailDto): Promise<UserResponse> {
    const { new_email, user_id } = setUserEmailDto

    const existingUser = await this.prismaService.user.findFirst({
      where: { OR: [{ email: new_email }, { new_email }] }
    })

    if (existingUser) {
      throw new Error('NEW_EMAIL_IS_ALREADY_ASSOCIATED_WITH_A_USER')
    }

    const user = await this.prismaService.user.update({
      where: { id: user_id },
      data: { email: new_email, new_email: null }
    })

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      first_name: user.first_name,
      last_name: user.last_name
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, user_id?: string): Promise<UserResponse> {
    const { new_password, old_password } = changePasswordDto

    if (!user_id) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }

    if (new_password === old_password) {
      throw new BadRequestException('NEW_PASSWORD_IS_SAME_AS_OLD_PASSWORD')
    }

    const user = await this.userService.findOne({ where: { id: user_id } })
    if (!user) {
      throw new NotFoundException('USER_DOES_NOT_EXIST')
    }
    if (user.status !== 'active') {
      throw new BadRequestException(`USER_IS_${user.status.toUpperCase()}`)
    }

    if (!user.password) {
      throw new BadRequestException('USER_PASSWORD_NOT_SET')
    }
    const isOldPasswordCorrect = await this.commonService.comparePassword(old_password, user.password)
    if (!isOldPasswordCorrect) {
      throw new BadRequestException('OLD_PASSWORD_IS_INCORRECT')
    }

    // Check if new password was used before
    const oldPasswords = user.old_passwords || []
    for (const oldPass of oldPasswords) {
      if (await this.commonService.comparePassword(new_password, oldPass)) {
        throw new BadRequestException('PASSWORD_IS_ALREADY_USED_BEFORE')
      }
    }

    const hashedNewPassword = await this.commonService.hashPassword(new_password)
    const updatedOldPasswords = [...(oldPasswords.filter((p) => p !== null) as string[]).slice(-2), user.password!]

    await this.prismaService.user.update({
      where: { id: user_id },
      data: {
        password: hashedNewPassword,
        old_passwords: updatedOldPasswords
      }
    })

    await this.authTokenService.deleteAuthTokens({ where: { user_id } })

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status
    }
  }

  async setUserPassword(setUserPasswordDto: SetUserPasswordDto): Promise<{ id: string; message: string }> {
    const { password, user_id } = setUserPasswordDto

    const hashedPassword = await this.commonService.hashPassword(password)
    const user = await this.prismaService.user.update({
      where: { id: user_id },
      data: { password: hashedPassword }
    })

    return { id: user.id, message: 'PASSWORD_SET' }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponse> {
    const { email } = forgotPasswordDto

    const user = await this.userService.findOne({ where: { email } })
    if (!user) {
      throw new NotFoundException('USER_DOES_NOT_EXIST')
    }

    await this.verificationTokenService.createVerificationToken({
      data: {
        email: user.email,
        expired_at: new Date(Date.now() + 1000 * 5 * 60), // 5 minutes
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        type: 'forgot_password',
        user_id: user.id
      }
    })

    return { message: 'FORGOT_PASSWORD_EMAIL_SENT', success: true }
  }

  async retryForgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponse> {
    const { email } = forgotPasswordDto

    const user = await this.userService.findOne({ where: { email } })
    if (!user) {
      throw new Error('USER_DOES_NOT_EXIST')
    }

    return { message: 'FORGOT_PASSWORD_EMAIL_RESENT', success: true }
  }

  async verifyForgotPassword(verifyForgotPasswordDto: VerifyForgotPasswordDto): Promise<UserResponse> {
    const { email, password, token } = verifyForgotPasswordDto

    const verificationToken = await this.verificationTokenService.getVerificationToken({
      where: { email, token, type: 'forgot_password', status: 'unverified' }
    })
    if (!verificationToken?.id) {
      throw new Error('INVALID_TOKEN')
    }

    const hashedPassword = await this.commonService.hashPassword(password)
    const user = await this.prismaService.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    await this.authTokenService.deleteAuthTokens({ where: { user_id: user.id } })

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status
    }
  }

  async verifyForgotPasswordCode(params: VerifyForgotPasswordCodeDto): Promise<MessageResponse> {
    const { email, token } = params || {}

    const verificationToken = await this.verificationTokenService.getVerificationToken({
      where: { email, token, type: 'forgot_password', status: 'unverified' }
    })
    if (!verificationToken?.id) {
      throw new Error('OTP_IS_NOT_VALID')
    }

    return { message: 'OTP_IS_VALID', success: true }
  }

  async verifyUserPassword(verifyUserPasswordDto: VerifyUserPasswordDto, user_id?: string): Promise<MessageResponse> {
    const { password } = verifyUserPasswordDto

    if (!user_id) {
      throw new Error('UNAUTHORIZED')
    }

    const user = await this.userService.findOne({ where: { id: user_id } })
    if (!user) {
      throw new Error('USER_IS_NOT_FOUND')
    }
    if (user.status !== 'active') {
      throw new Error(`USER_IS_${user.status.toUpperCase()}`)
    }

    if (!user.password) {
      throw new Error('USER_PASSWORD_NOT_SET')
    }
    const isPasswordCorrect = await this.commonService.comparePassword(password, user.password)

    return {
      message: isPasswordCorrect ? 'PASSWORD_IS_CORRECT' : 'PASSWORD_IS_INCORRECT',
      success: isPasswordCorrect
    }
  }

  async getAuthUser(user_id?: string): Promise<UserResponse> {
    if (!user_id) {
      throw new UnauthorizedException('UNAUTHORIZED')
    }

    const user = await this.userService.findOne({
      where: { id: user_id }
    })
    if (!user?.id) {
      throw new Error('USER_NOT_FOUND')
    }

    return {
      ...pick(user, ['id', 'email', 'first_name', 'last_name', 'status']),
      roles: user.role_users.map((ru) => ru.role.name)
    }
  }

  async assignRole(assignRoleDto: AssignRoleDto) {
    const { user_id, role_id } = assignRoleDto

    const role = await this.roleService.findOne({ where: { id: role_id } })
    if (!role) {
      throw new Error('ROLE_NOT_FOUND')
    }

    try {
      return await this.prismaService.roleUser.create({
        data: {
          user_id,
          role_id: role.id
        }
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prismaService.roleUser.findUnique({
          where: {
            user_id_role_id: {
              user_id,
              role_id: role.id
            }
          }
        })
        if (existing) {
          return existing
        }
      }
      throw error
    }
  }

  async revokeRole(revokeRoleDto: RevokeRoleDto) {
    const { user_id, role_id } = revokeRoleDto

    const role = await this.roleService.findOne({ where: { id: role_id } })
    if (!role) {
      throw new Error('ROLE_NOT_FOUND')
    }

    return this.prismaService.roleUser.delete({
      where: {
        user_id_role_id: {
          user_id,
          role_id: role.id
        }
      }
    })
  }
}
