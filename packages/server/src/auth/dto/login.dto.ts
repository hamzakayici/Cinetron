import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@cinetron.local' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'ChangeMe123!' })
    @IsNotEmpty()
    password: string;
}
