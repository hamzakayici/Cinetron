import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, Put, UseInterceptors, UploadedFiles, UploadedFile, Query } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateMediaDto, UpdateMediaDto } from './dto/media.dto';
import { UserRole } from '../users/user.entity';

// Multer storage configuration
const storage = diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'videoFile' ? './public/uploads/videos' : './public/uploads/images';
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

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

    @Get('episode/:id')
    @ApiOperation({ summary: 'Get single episode with playback details' })
    getEpisode(@Param('id') id: string) {
        return this.mediaService.getEpisode(id);
    }

    @Get('scan')
    @ApiOperation({ summary: 'Trigger directory scan for new media' })
    async scanLibrary() {
        return this.mediaService.scanLibrary();
    }

    @Get('metadata/search')
    @ApiOperation({ summary: 'Search TMDB for metadata' })
    async searchMetadata(@Query('q') query: string, @Query('type') type: 'movie' | 'tv', @Query('year') year?: number) {
        return this.mediaService.searchTMDB(query, type, year);
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

    // Admin endpoints
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    @ApiOperation({ summary: 'Create new media (admin only)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'videoFile', maxCount: 1 },
            { name: 'posterFile', maxCount: 1 },
            { name: 'backdropFile', maxCount: 1 },
        ], { storage }),
    )
    async createMedia(
        @UploadedFiles() files: {
            videoFile?: Express.Multer.File[];
            posterFile?: Express.Multer.File[];
            backdropFile?: Express.Multer.File[];
        },
        @Body() createMediaDto: CreateMediaDto,
    ) {
        return this.mediaService.createMedia(createMediaDto, files);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put(':id')
    @ApiOperation({ summary: 'Update media (admin only)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'videoFile', maxCount: 1 },
            { name: 'posterFile', maxCount: 1 },
            { name: 'backdropFile', maxCount: 1 },
        ], { storage }),
    )
    async updateMedia(
        @Param('id') id: string,
        @UploadedFiles() files: {
            videoFile?: Express.Multer.File[];
            posterFile?: Express.Multer.File[];
            backdropFile?: Express.Multer.File[];
        },
        @Body() updateMediaDto: UpdateMediaDto,
    ) {
        return this.mediaService.updateMedia(id, updateMediaDto, files);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete media (admin only)' })
    async deleteMedia(@Param('id') id: string) {
        return this.mediaService.deleteMedia(id);
    }

    // Subtitle endpoints
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post(':id/subtitles')
    @ApiOperation({ summary: 'Upload subtitle for media (admin only)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('subtitleFile', {
            storage: diskStorage({
                destination: './public/uploads/subtitles',
                filename: (req, file, cb) => {
                    const ext = extname(file.originalname);
                    cb(null, `${uuidv4()}${ext}`);
                },
            }),
        }),
    )
    async uploadSubtitle(
        @Param('id') mediaId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('language') language: string,
        @Body('label') label: string,
    ) {
        return this.mediaService.addSubtitle(mediaId, file.filename, language, label);
    }

    @Get(':id/subtitles')
    @ApiOperation({ summary: 'Get all subtitles for media' })
    async getSubtitles(@Param('id') mediaId: string) {
        return this.mediaService.getSubtitles(mediaId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id/subtitles/:subtitleId')
    @ApiOperation({ summary: 'Delete subtitle (admin only)' })
    async deleteSubtitle(
        @Param('id') mediaId: string,
        @Param('subtitleId') subtitleId: string,
    ) {
        return this.mediaService.deleteSubtitle(subtitleId);
    }
}
