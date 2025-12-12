import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { WatchHistory } from './watch-history.entity';
import { Favorite } from '../users/favorite.entity';

import { BullModule } from '@nestjs/bullmq';
import { TmdbService } from './tmdb.service';


@Module({
    imports: [
        TypeOrmModule.forFeature([Media, WatchHistory, Favorite]),
        BullModule.registerQueue({
            name: 'media',
        }),
    ],
    controllers: [MediaController],
    providers: [MediaService, TmdbService],
    exports: [MediaService],
})
export class MediaModule { }
