import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // ✅ TRUST NGINX
  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);

  // ✅ CORS (dynamic from env)
  const allowedOrigins = process.env.FRONTEND_URLS?.split(',') || [];

  app.enableCors({
    origin: (origin, callback) => {
      console.log(allowedOrigins);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // ✅ Swagger (avoid /api conflict)
  const config = new DocumentBuilder()
    .setTitle('Matcha API')
    .setDescription('Dating app API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ✅ static uploads
  app.use('/uploads', express.static('uploads'));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
