import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Controller('system')
export class SystemController {
    constructor(private readonly usersService: UsersService) { }

    @Get('setup-status')
    async getSetupStatus() {
        // Check if any admin exists
        // Since we don't have a direct 'exist' method for role, we might need to add one or check count
        // For MVP: Check if *any* user exists, or specifically admin.
        // Let's assume if no users exist, setup is required.
        const usersCount = await this.usersService.count();
        return {
            isSetup: usersCount > 0
        };
    }

    @Post('setup')
    async setupSystem(@Body() body: any) {
        // Double check setup status to prevent overwrite
        const usersCount = await this.usersService.count();
        if (usersCount > 0) {
            throw new BadRequestException('System is already setup');
        }

        const { email, password, firstName, lastName } = body;

        if (!email || !password) {
            throw new BadRequestException('Email and password are required');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await this.usersService.create({
            email,
            passwordHash,
            firstName: firstName || 'Admin',
            lastName: lastName || 'User',
            role: UserRole.ADMIN,
        });

        return { message: 'Setup complete' };
    }
}
