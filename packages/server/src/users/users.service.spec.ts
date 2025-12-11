import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

describe('UsersService', () => {
    let service: UsersService;

    const mockRepository = {
        findOneBy: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should find a user by email', async () => {
        const user = new User();
        user.email = 'test@test.com';
        mockRepository.findOneBy.mockReturnValue(user);

        expect(await service.findOne('test@test.com')).toEqual(user);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
});
