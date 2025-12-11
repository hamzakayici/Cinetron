import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { typeOrmConfig } from './config/typeorm.config';

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
        AuthModule,
        AuthModule,
        UsersModule,
        MediaModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
