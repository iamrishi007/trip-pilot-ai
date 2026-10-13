import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Rushikesh Gaware',
    description: 'User full name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'rushikesh@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
