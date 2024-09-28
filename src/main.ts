import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './common/format-response.interceptor';
import { InvokeRecordInterceptor } from './common/invoke-record.interceptor';
import { CustomExceptionFilter } from './common/custom.filter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 设置为静态路径，静态路径需要NestExpressApplication 这个类型
  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());

  app.useGlobalFilters(new CustomExceptionFilter());

  app.enableCors();
  // 创建swagger
  const config = new DocumentBuilder()
    .setTitle('会议室系统')
    .setDescription('api接口文档')
    .setVersion('1.0.0')
    .build();
  const swagger = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, swagger);

  const configService = app.get(ConfigService);

  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
