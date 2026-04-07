
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Matcha API')
    .setDescription('Dating app API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.enableCors({
    origin: ['http://localhost:3000','http://z3t11c4.42bangkok.com:3000/'],
    credentials: true,
  });
  app.use('/uploads', express.static('uploads'));

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
}
bootstrap();
