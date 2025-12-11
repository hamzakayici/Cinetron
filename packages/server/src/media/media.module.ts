import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './media.entity';

import { BullModule } from '@nestjs/bullmq';

import { WatchHistory } from './watch-history.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Media, WatchHistory]),
        BullModule.registerQueue({
            name: 'metadata-queue',
        }),
    ],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
