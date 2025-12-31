import { Controller, Get, Post, Delete, Body, Param, UseGuards, UnauthorizedException, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all users (Admin only)' })
    async findAll() {
        const users = await this.usersService.findAll();
        // Remove passwords
        return users.map(u => {
            const { passwordHash, ...result } = u;
            return result;
        });
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    async create(@Body() userDto: any) {
        // Map DTO to Entity partial
        const newUser: Partial<User> = {
            email: userDto.email,
            passwordHash: userDto.password, // Service will hash this
            firstName: userDto.firstName,
            lastName: userDto.lastName,
            role: userDto.role || UserRole.VIEWER,
        };
        const created = await this.usersService.create(newUser);
        const { passwordHash, ...result } = created;
        return result;
    }

    @Patch(':id/password')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update user password (Admin only)' })
    async updatePassword(@Param('id') id: string, @Body('password') password: string) {
        await this.usersService.updatePassword(id, password);
        return { message: 'Şifre başarıyla güncellendi' };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    async delete(@Param('id') id: string) {
        await this.usersService.delete(id);
        return { message: 'Kullanıcı başarıyla silindi' };
    }
}
