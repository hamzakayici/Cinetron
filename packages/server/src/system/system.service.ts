import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SystemService implements OnModuleInit {
    private readonly logger = new Logger(SystemService.name);

    constructor(private readonly usersService: UsersService) { }

    async onModuleInit() {
        await this.ensureAdminAccount();
    }

    private async ensureAdminAccount() {
        const adminEmail = 'admin@cinetron.com';
        const adminPassword = 'admin123';
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        try {
            const existingAdmin = await this.usersService.findOne(adminEmail);

            if (!existingAdmin) {
                await this.usersService.create({
                    email: adminEmail,
                    passwordHash,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: UserRole.ADMIN,
                });
                this.logger.log('Admin user created successfully.');
            } else {
                // FORCE RESET PASSWORD ON STARTUP TO ENSURE ACCESS
                await this.usersService.updatePassword(existingAdmin.id, passwordHash);
                this.logger.log('Admin password reset to default (admin123) for security/demo purposes.');
            }
        } catch (error) {
            this.logger.error('Failed to ensure admin account', error);
        }
    }
}
