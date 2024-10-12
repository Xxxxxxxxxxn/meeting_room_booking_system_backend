import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';
import { MeetingRoom } from './meeting-room/entities/meeting-room.entity';
import { Booking } from './booking/entities/booking.entity';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path';
import { LoginGuard } from './common/login.guard';
import { PermissionGuard } from './common/permission.guard';
import { MettingRoomModule } from './meeting-room/meeting-room.module';
import { BookingModule } from './booking/booking.module';
import { StatisticModule } from './statistic/statistic.module';
import { MinioModule } from './minio/minio.module';
import { AuthModule } from './auth/auth.module';
import { WinstonLogger, WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { CustomTypeOrmLogger } from './CustomTypeOrmLogger';
@Module({
  imports: [
    // jwt
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '30m', // 默认 30 分钟
          },
        };
      },
      inject: [ConfigService],
    }),
    // 配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(__dirname, '.dev.env'),
        path.join(__dirname, '.env'),
      ],
    }),
    // 数据库
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService, logger: WinstonLogger) {
        console.log('configService: ', configService);
        return {
          type: 'mysql',
          host: configService.get('mysql_server_host'),
          port: configService.get('mysql_server_port'),
          username: configService.get('mysql_server_username'),
          password: configService.get('mysql_server_password'),
          database: configService.get('mysql_server_database'),
          synchronize: true,
          logging: true,
          // 这个咋有问题啊 说logger上没log方法
          // logger: new CustomTypeOrmLogger(logger),
          entities: [User, Role, Permission, MeetingRoom, Booking],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: {
            authPlugin: 'sha256_password',
          },
        };
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        level: 'debug',
        transports: [
          // new winston.transports.File({
          //   filename: `${process.cwd()}/log`,
          // }),
          // 按日期分割
          new winston.transports.DailyRotateFile({
            level: configService.get('winston_log_level'),
            dirname: configService.get('winston_log_dirname'),
            filename: configService.get('winston_log_filename'),
            datePattern: configService.get('winston_log_date_pattern'),
            maxSize: configService.get('winston_log_max_size'),
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
          // 新起一个服务接受日志
          new winston.transports.Http({
            host: 'localhost',
            port: 3002,
            path: '/log',
          }),
        ],
      }),
      inject: [ConfigService],
    }),

    UserModule,
    RedisModule,
    EmailModule,
    MettingRoomModule,
    BookingModule,
    StatisticModule,
    MinioModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
