import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(email: string): Promise<User | undefined> {
        return this.usersRepository.findOneBy({ email: email.toLowerCase() });
    }

    async findById(id: string): Promise<User | undefined> {
        return this.usersRepository.findOneBy({ id });
    }

    async create(user: Partial<User>): Promise<User> {
        if (user.passwordHash) {
            const salt = await bcrypt.genSalt();
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
        const newUser = this.usersRepository.create(user);
        return this.usersRepository.save(newUser);
    }

    async count(): Promise<number> {
        return this.usersRepository.count();
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async updatePassword(id: string, password: string): Promise<void> {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);
        await this.usersRepository.update(id, { passwordHash });
    }

    async delete(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
