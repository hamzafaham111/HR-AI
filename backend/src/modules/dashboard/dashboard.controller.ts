import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardOverviewDto, DashboardStatsDto, QuickStatsDto } from './dto/dashboard.dto';
import { ApiResponseDto } from '../../common/dto/response.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard overview with essential metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully', type: DashboardOverviewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardOverview(@Request() req): Promise<ApiResponseDto<DashboardOverviewDto>> {
    const overview = await this.dashboardService.getDashboardOverview(req.user._id.toString());
    return new ApiResponseDto(true, 'Dashboard overview retrieved successfully', overview);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed statistics about all system components' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: DashboardStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@Request() req): Promise<ApiResponseDto<DashboardStatsDto>> {
    const statistics = await this.dashboardService.getDetailedStatistics(req.user._id.toString());
    return new ApiResponseDto(true, 'Statistics retrieved successfully', statistics);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comprehensive analytics and insights' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(@Request() req): Promise<ApiResponseDto<any>> {
    const analytics = await this.dashboardService.getAnalytics(req.user._id.toString());
    return new ApiResponseDto(true, 'Analytics retrieved successfully', analytics);
  }

  @Get('quick-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get very fast basic stats only' })
  @ApiResponse({ status: 200, description: 'Quick stats retrieved successfully', type: QuickStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQuickStats(@Request() req): Promise<ApiResponseDto<QuickStatsDto>> {
    const stats = await this.dashboardService.getQuickStats(req.user._id.toString());
    return new ApiResponseDto(true, 'Quick stats retrieved successfully', stats);
  }
}
