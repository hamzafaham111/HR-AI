import { Controller, Post, Get, Put, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserCreateDto, UserLoginDto, UserResponseDto, TokenResponseDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ProfileUpdateDto, PasswordChangeDto, AccountSettingsDto } from './dto/auth.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() userData: UserCreateDto): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.authService.register(userData);
    return new ApiResponseDto(true, 'User registered successfully', user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginData: UserLoginDto): Promise<ApiResponseDto<TokenResponseDto>> {
    console.log('loginData', loginData);
    const tokens = await this.authService.login(loginData);
    console.log('tokens', tokens);
    let response = new ApiResponseDto(true, 'Login successful', tokens);
    console.log('response', response);
    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenData: RefreshTokenDto): Promise<ApiResponseDto<TokenResponseDto>> {
    const tokens = await this.authService.refreshToken(refreshTokenData);
    return new ApiResponseDto(true, 'Token refreshed successfully', tokens);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.authService.getCurrentUser(req.user._id.toString());
    return new ApiResponseDto(true, 'User information retrieved', user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordData: ForgotPasswordDto): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.forgotPassword(forgotPasswordData);
    return new ApiResponseDto(true, result.message, result);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordData: ResetPasswordDto): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.resetPassword(resetPasswordData);
    return new ApiResponseDto(true, result.message, result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(): Promise<ApiResponseDto<{ message: string }>> {
    return new ApiResponseDto(true, 'Successfully logged out', { message: 'Successfully logged out' });
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already registered by another user' })
  async updateProfile(@Request() req, @Body() profileData: ProfileUpdateDto): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.authService.updateProfile(req.user._id.toString(), profileData);
    return new ApiResponseDto(true, 'Profile updated successfully', user);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(@Request() req, @Body() passwordData: PasswordChangeDto): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.changePassword(req.user._id.toString(), passwordData);
    return new ApiResponseDto(true, result.message, result);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update account settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAccountSettings(@Request() req, @Body() settingsData: AccountSettingsDto): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authService.updateAccountSettings(req.user._id.toString(), settingsData);
    return new ApiResponseDto(true, result.message, result);
  }

}
