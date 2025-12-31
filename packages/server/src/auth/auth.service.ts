import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<User | null> {
        console.log(`Validating user: ${email}`);
        const user = await this.usersService.findOne(email);
        if (!user) {
            console.log(`User not found: ${email}`);
            return null;
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            console.log(`Password match for user: ${email}`);
            const { passwordHash, ...result } = user;
            return result as User;
        } else {
            console.log(`Password mismatch for user: ${email}`);
            return null;
        }
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async emergencyReset() {
        const adminEmail = 'admin@cinetron.com';
        const user = await this.usersService.findOne(adminEmail);
        if (user) {
            const hash = await bcrypt.hash('admin123', 10);
            await this.usersService.updatePassword(user.id, hash);
            return { message: 'Yönetici şifresi admin123 olarak sıfırlandı' };
        }
        return { message: 'Yönetici kullanıcısı bulunamadı' };
    }
}
