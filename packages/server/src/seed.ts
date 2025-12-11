import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { MediaService } from './media/media.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@cinetron.com';
    const adminPassword = 'admin123';
    const existingAdmin = await usersService.findOne(adminEmail);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (!existingAdmin) {
        await usersService.create({
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
        });
        console.log('Admin user created');
    } else {
        // Force update password to ensure access in case of mismatch
        await usersService.updatePassword(existingAdmin.id, passwordHash);
        console.log('Admin password updated to default');
    }

    // --- Media Seeding ---
    // User requested removal of all demo data.
    console.log('Skipping media seeding as per user request (System uses real data sources now).');
}
bootstrap();
