import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [SystemController],
})
export class SystemModule { }
