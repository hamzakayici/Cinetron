import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Get()
    @ApiOperation({ summary: 'Get all media items' })
    findAll(): Promise<Media[]> {
        return this.mediaService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get single media item with playback details' })
    findOne(@Param('id') id: string): Promise<Media> {
        return this.mediaService.findOne(id);
    }

    @Get('scan')
    @ApiOperation({ summary: 'Trigger directory scan for new media' })
    async scanLibrary() {
        return this.mediaService.scanLibrary();
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/progress')
    @ApiOperation({ summary: 'Save watch progress' })
    async saveProgress(@Param('id') id: string, @Body('progress') progress: number, @Request() req) {
        return this.mediaService.saveProgress(req.user.userId, id, progress);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get(':id/progress')
    @ApiOperation({ summary: 'Get watch progress' })
    async getProgress(@Param('id') id: string, @Request() req) {
        const progress = await this.mediaService.getProgress(req.user.userId, id);
        return { progress };
    }
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/user/history')
    @ApiOperation({ summary: 'Get user watch history' })
    getHistory(@Request() req) {
        return this.mediaService.getHistory(req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/user/favorites')
    @ApiOperation({ summary: 'Get user favorites' })
    getFavorites(@Request() req) {
        return this.mediaService.getFavorites(req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/favorite')
    @ApiOperation({ summary: 'Add media to favorites' })
    addFavorite(@Param('id') id: string, @Request() req) {
        return this.mediaService.addFavorite(req.user.userId, id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete(':id/favorite')
    @ApiOperation({ summary: 'Remove media from favorites' })
    removeFavorite(@Param('id') id: string, @Request() req) {
        return this.mediaService.removeFavorite(req.user.userId, id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get(':id/favorite')
    @ApiOperation({ summary: 'Check if media is in favorites' })
    async checkFavorite(@Param('id') id: string, @Request() req) {
        const isFavorite = await this.mediaService.checkFavorite(req.user.userId, id);
        return { isFavorite };
    }
}
