import { Controller, Get, Post, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'List all users (Admin only)' })
    async findAll() {
        // TODO: Check for Admin role
        return this.usersService.count(); // For now just creating the structure, need to implement findAll in service
    }

    @Post()
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    async create(@Body() userData: Partial<User>) {
        // TODO: Check for Admin role
        return this.usersService.create(userData);
    }
}
