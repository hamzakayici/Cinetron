import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { typeOrmConfig } from './config/typeorm.config';
import { SystemModule } from './system/system.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => typeOrmConfig(configService),
            inject: [ConfigService],
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST') || 'localhost',
                    port: parseInt(configService.get('REDIS_PORT') || '6379'),
                },
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        MediaModule,
        SystemModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
