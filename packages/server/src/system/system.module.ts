import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [ConfigModule, UsersModule],
    controllers: [SystemController],
    providers: [SystemService],
})
export class SystemModule { }
