import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserCreateDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User role', default: 'user' })
  @IsString()
  @IsOptional()
  role?: string = 'user';

  @ApiPropertyOptional({ description: 'User company' })
  @IsString()
  @IsOptional()
  company?: string;
}

export class UserLoginDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiPropertyOptional({ description: 'User company' })
  company?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiProperty({ description: 'User active status' })
  isActive: boolean;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'Access token' })
  access_token: string;

  @ApiProperty({ description: 'Refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Token type' })
  token_type: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expires_in: number;

  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refresh_token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

export class ProfileUpdateDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  @MinLength(2)
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @MinLength(2)
  last_name: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class PasswordChangeDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New password', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

export class AccountSettingsDto {
  @ApiProperty({ description: 'Email notifications enabled' })
  @IsBoolean()
  email_notifications: boolean;

  @ApiProperty({ description: 'Job alerts enabled' })
  @IsBoolean()
  job_alerts: boolean;

  @ApiProperty({ description: 'Resume updates enabled' })
  @IsBoolean()
  resume_updates: boolean;
}
