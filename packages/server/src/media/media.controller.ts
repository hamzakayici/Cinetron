import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Get()
    @ApiOperation({ summary: 'Get all media items' })
    findAll(): Promise<Media[]> {
        console.log("Fetching all media items");
        return this.mediaService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get single media item with playback details' })
    findOne(@Param('id') id: string): Promise<Media> {
        return this.mediaService.findOne(id);
    }

    @Post('scan')
    @ApiOperation({ summary: 'Trigger directory scan for new media' })
    scanLibrary(): Promise<{ message: string, added: number }> {
        return this.mediaService.scanDirectory();
    }
}
