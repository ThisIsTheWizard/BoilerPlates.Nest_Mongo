import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { isEmail, isStrongPassword } from 'validator'

@Injectable()
export class CommonService {
  constructor(private configService: ConfigService) {}

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  decodeJWTToken(token: string): jwt.JwtPayload | string | null {
    return jwt.decode(token)
  }

  generateJWTToken(payload: object, isRefreshToken = false): string {
    const secret = this.configService.get<string>('JWT_SECRET', '')
    const expiresIn = isRefreshToken ? '7d' : '1h'
    return jwt.sign(payload, secret, { expiresIn })
  }

  async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10)
    return bcrypt.hash(password, rounds)
  }

  validateEmail(email: string): boolean {
    return isEmail(email)
  }

  validatePassword(password: string): boolean {
    return isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
  }

  verifyJWTToken(token: string): jwt.JwtPayload | string {
    return jwt.verify(token, this.configService.get<string>('JWT_SECRET', ''))
  }
}
