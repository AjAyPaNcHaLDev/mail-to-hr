import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() { 
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Email Sender API')
    .setDescription('Sends bulk emails from Excel files')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
const PORT =process.env.PORT??777;
  await app.listen(PORT);
  Logger.log(`Server running on  http://localhost:${PORT}`)
  Logger.log(`Server running on API  http://localhost:${PORT}/api`)

}
bootstrap();
