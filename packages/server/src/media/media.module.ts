import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './media.entity';

import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        TypeOrmModule.forFeature([Media]),
        BullModule.registerQueue({
            name: 'metadata-queue',
        }),
    ],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
