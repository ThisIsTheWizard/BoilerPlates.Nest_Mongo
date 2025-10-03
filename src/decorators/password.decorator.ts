import { IsStrongPassword } from 'class-validator'

export const IsPassword = () =>
  IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })
