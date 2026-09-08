import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('MST-WalletWatch API')
    .setDescription(
      'Backend monitoring and alerting service for native currency wallet balances on MST Testnet and MST Mainnet.',
    )
    .setVersion('1.0')
    .addTag('Monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`MST-WalletWatch Service is running on http://localhost:${port}`);
  logger.log(`Swagger UI Documentation:   http://localhost:${port}/api/docs`);
  logger.log(`Health Endpoint:            http://localhost:${port}`);
  logger.log(`Wallet States:              http://localhost:${port}/status`);
  logger.log(`Balance Audit Logs:         http://localhost:${port}/logs`);
  logger.log(`Manual Check Trigger:       POST/GET http://localhost:${port}/check-now`);
  logger.log(`=======================================================`);
}

bootstrap();
