import { Controller, Get, Post, Body } from '@nestjs/common';
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

    @Post('scan')
    @ApiOperation({ summary: 'Trigger directory scan for new media' })
    scanLibrary(): Promise<{ message: string, added: number }> {
        return this.mediaService.scanDirectory();
    }
}
