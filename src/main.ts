import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import 'dotenv/config'

import { AppModule } from '@/app/app.module'
import { GlobalExceptionFilter } from '@/filters/global-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for all origins
  app.enableCors({ origin: '*' })

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter())

  // Global validation pipe for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const messages = errors
          .flatMap((error) => (error.constraints ? Object.values(error.constraints) : []))
          .map((msg) => msg.toUpperCase().replace(/\s+/g, '_'))
        return new BadRequestException({ messages, success: false })
      },
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  )

  // Swagger setup
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().setTitle('Nest.js API Server').setVersion('v0.1.0.0').build()
    )
  )

  await app.listen(process.env.PORT ?? 3000)

  console.log(`====> Server running on port http://localhost:${process.env.PORT ?? 3000}/api/docs <====`)
}

bootstrap()
