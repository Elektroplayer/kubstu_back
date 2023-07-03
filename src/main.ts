import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function bootstrap() {
  mongoose.connect(process.env.MONGO_URI);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
