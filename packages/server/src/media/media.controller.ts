import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, Put, UseInterceptors, UploadedFiles, UploadedFile, Query, Res } from '@nestjs/common';
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
        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
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
    async searchMetadata(@Query('q') query: string, @Query('type') type: 'movie' | 'tv' | 'all' = 'all', @Query('year') year?: number) {
        return this.mediaService.searchTMDB(query, type, year);
    }

    @Get('metadata/tmdb/:id')
    @ApiOperation({ summary: 'Get full TMDB details for a movie/show' })
    async getTMDBDetails(@Param('id') id: string, @Query('type') type: 'movie' | 'tv') {
        return this.mediaService.getTMDBDetails(parseInt(id), type);
    }

    @Get('metadata/tmdb/:id/season/:seasonNum')
    @ApiOperation({ summary: 'Get TMDB season details with episodes' })
    async getTMDBSeasonDetails(
        @Param('id') id: string,
        @Param('seasonNum') seasonNum: string,
    ) {
        return this.mediaService.getTMDBSeasonDetails(parseInt(id), parseInt(seasonNum));
    }

    @Get('stream/external')
    @ApiOperation({ summary: 'Proxy external stream for playback' })
    async streamExternal(@Query('url') url: string, @Res() res) {
        return this.mediaService.streamExternal(url, res);
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
        const fs = require('fs');
        const path = require('path');

        let finalFilename = file.filename;
        let finalPath = file.path;

        // Check if conversion is needed (SRT -> VTT)
        // Check if conversion is needed (SRT -> VTT)
        if (file.originalname.toLowerCase().endsWith('.srt')) {
            const buffer = fs.readFileSync(file.path);
            
            // Detect Encoding
            const jschardet = require('jschardet');
            const iconv = require('iconv-lite');
            
            const detected = jschardet.detect(buffer);
            const encoding = detected.encoding || 'utf-8';
            
            // Decode content to UTF-8 string
            const srtContent = iconv.decode(buffer, encoding);
            
            // Simple SRT to VTT conversion
            // 1. Add WEBVTT header
            // 2. Convert comma decimal separators to dots (00:00:20,000 -> 00:00:20.000)
            const vttContent = 'WEBVTT\n\n' + srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

            // Save as .vtt
            const vttFilename = file.filename.replace(/\.srt$/i, '.vtt');
            const vttPath = path.join(path.dirname(file.path), vttFilename);

            // Write as UTF-8
            fs.writeFileSync(vttPath, vttContent, 'utf8');
            
            // Delete original SRT
            fs.unlinkSync(file.path);

            finalFilename = vttFilename;
        }

        return this.mediaService.addSubtitle(mediaId, finalFilename, language, label);
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

    // Episode Management
    @Post(':id/episodes')
    @ApiOperation({ summary: 'Upload episode for a series' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'videoFile', maxCount: 1 },
        { name: 'stillImage', maxCount: 1 },
    ], { storage }))
    async createEpisode(
        @Param('id') mediaId: string,
        @UploadedFiles() files: {
            videoFile?: Express.Multer.File[];
            stillImage?: Express.Multer.File[];
        },
        @Body() body: any,
    ) {
        return this.mediaService.createEpisode(mediaId, files, body);
    }

    @Get(':id/episodes')
    @ApiOperation({ summary: 'Get all episodes for a series' })
    async getEpisodes(@Param('id') mediaId: string) {
        return this.mediaService.getEpisodesByMedia(mediaId);
    }

    @Delete('episodes/:episodeId')
    @ApiOperation({ summary: 'Delete an episode' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async deleteEpisode(@Param('episodeId') episodeId: string) {
        return this.mediaService.deleteEpisode(episodeId);
    }
}
