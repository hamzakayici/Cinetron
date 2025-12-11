import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@cinetron.com';
    const adminPassword = 'admin123';
    const existingAdmin = await usersService.findOne(adminEmail);

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await usersService.create({
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    await app.close();
}
bootstrap();
