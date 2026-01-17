import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors();

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Day 4 - Simple Storage dApp API - Bryan Dewa Wicaksana - 211011401646')
    .setDescription(
      'Backend API untuk membaca data dari SimpleStorage smart contract di Avalanche Fuji Testnet',
    )
    .setVersion('1.0')
    .addTag('blockchain')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, documentFactory);

  // Run on port 3002 to avoid conflict with other services
  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/documentation`);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
  process.exit(1);
});
