import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message =
        typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message || message
    } else if (exception instanceof JsonWebTokenError || exception instanceof TokenExpiredError) {
      status = HttpStatus.UNAUTHORIZED
      message = 'Invalid or expired token'
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack)

      // Handle specific error messages that should be converted to proper HTTP status codes
      if (exception.message.includes('UNAUTHORIZED')) {
        status = HttpStatus.UNAUTHORIZED
        message = 'UNAUTHORIZED'
      } else if (exception.message.includes('NOT_FOUND') || exception.message.includes('DOES_NOT_EXIST')) {
        status = HttpStatus.NOT_FOUND
        message = 'Resource not found'
      } else if (exception.message.includes('INVALID') || exception.message.includes('BAD_REQUEST')) {
        status = HttpStatus.BAD_REQUEST
        message = 'Bad request'
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString()
    })
  }
}
