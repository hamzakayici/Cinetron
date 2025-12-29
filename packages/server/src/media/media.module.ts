import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { WatchHistory } from './watch-history.entity';
import { Favorite } from '../users/favorite.entity';
import { Subtitle } from './subtitle.entity';
import { TmdbService } from './tmdb.service';
import { Episode } from './episode.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Media, Episode, WatchHistory, Favorite, Subtitle]),
    ],
    controllers: [MediaController],
    providers: [MediaService, TmdbService],
    exports: [MediaService],
})
export class MediaModule { }
