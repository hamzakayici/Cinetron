import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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

    @Post('scan')
    @ApiOperation({ summary: 'Trigger directory scan for new media' })
    scanLibrary(): Promise<{ message: string, added: number, details?: any }> {
        return this.mediaService.scanDirectory();
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
}
