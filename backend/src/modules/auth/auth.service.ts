import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { UserCreateDto, UserLoginDto, UserResponseDto, TokenResponseDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ProfileUpdateDto, PasswordChangeDto, AccountSettingsDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(userData: UserCreateDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = new this.userModel({
      name: userData.name,
      email: userData.email,
      hashedPassword,
      role: userData.role || 'user',
      company: userData.company,
      isActive: true,
      isSuperuser: false,
    });

    const savedUser = await user.save();

    // Send welcome email (in background)
    try {
      // TODO: Implement email service
      console.log(`Welcome email sent to ${userData.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return this.mapToUserResponse(savedUser);
  }

  async login(loginData: UserLoginDto): Promise<TokenResponseDto> {
    const user = await this.userModel.findOne({ email: loginData.email });

    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Support legacy snake_case fields from older datasets
    const raw: any = typeof (user as any).toObject === 'function' ? (user as any).toObject() : (user as any);
    const hashedPassword: string | undefined = raw.hashedPassword ?? raw.hashed_password;
    const isActive: boolean = (raw.isActive ?? raw.is_active ?? true) as boolean;

    if (!hashedPassword) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const passwordMatches = await bcrypt.compare(loginData.password, String(hashedPassword));
    if (!passwordMatches) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    if (!isActive) {
      throw new BadRequestException('Account is deactivated');
    }

    // Create tokens
    const accessToken = await this.createAccessToken(user._id.toString());
    const refreshToken = await this.createRefreshToken(user._id.toString());

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 15 * 60, // 15 minutes in seconds
      user: this.mapToUserResponse(user),
    };
  }

  async refreshToken(refreshTokenData: RefreshTokenDto): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenData.refresh_token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Create new access token
      const accessToken = await this.createAccessToken(user._id.toString());

      return {
        access_token: accessToken,
        refresh_token: refreshTokenData.refresh_token, // Keep same refresh token
        token_type: 'bearer',
        expires_in: 15 * 60, // 15 minutes in seconds
        user: this.mapToUserResponse(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.mapToUserResponse(user);
  }

  async forgotPassword(forgotPasswordData: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: forgotPasswordData.email });
    
    if (user) {
      // Generate reset token (in a real app, this would be stored in database)
      const resetToken = 'reset_token_placeholder'; // In production, generate proper token
      user.resetToken = resetToken;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
      
      // Send reset email
      try {
        // TODO: Implement email service
        console.log(`Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error('Failed to send password reset email:', error);
      }
    }

    // Always return success to prevent email enumeration
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordData: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      resetToken: resetPasswordData.token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.hashedPassword = await bcrypt.hash(resetPasswordData.new_password, 12);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  async updateProfile(userId: string, profileData: ProfileUpdateDto): Promise<UserResponseDto> {
    // Check if email is already taken by another user
    if (profileData.email) {
      const existingUser = await this.userModel.findOne({
        email: profileData.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new ConflictException('Email already registered by another user');
      }
    }

    // Update user profile
    const updateData = {
      name: `${profileData.first_name} ${profileData.last_name}`,
      email: profileData.email,
      phone: profileData.phone,
    };

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      throw new BadRequestException('Failed to update profile');
    }

    return this.mapToUserResponse(user);
  }

  async changePassword(userId: string, passwordData: PasswordChangeDto): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    if (!await bcrypt.compare(passwordData.current_password, user.hashedPassword)) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(passwordData.new_password, 12);

    // Update password
    await this.userModel.findByIdAndUpdate(userId, {
      hashedPassword: newHashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async updateAccountSettings(userId: string, settingsData: AccountSettingsDto): Promise<{ message: string }> {
    await this.userModel.findByIdAndUpdate(userId, {
      settings: {
        email_notifications: settingsData.email_notifications,
        job_alerts: settingsData.job_alerts,
        resume_updates: settingsData.resume_updates,
      },
    });

    return { message: 'Account settings updated successfully' };
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }


  private async createAccessToken(userId: string): Promise<string> {
    const payload = { sub: userId, type: 'access' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const payload = { sub: userId, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });
  }

  private mapToUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
