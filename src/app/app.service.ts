import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getWelcomeMessage(): object {
    return { message: 'Welcome to the API service!', success: true }
  }
}
