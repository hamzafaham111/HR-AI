import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('db')
  @ApiOperation({ summary: 'Check database connectivity' })
  @ApiResponse({ status: 200, description: 'Database health status' })
  getDatabaseHealth() {
    const readyState = this.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const isUp = readyState === 1;
    return {
      ok: isUp,
      database: isUp ? 'up' : 'down',
      readyState,
      name: this.connection?.name,
      host: (this.connection as any)?.host,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Check API health with DB status' })
  @ApiResponse({ status: 200, description: 'API health status' })
  getHealth() {
    const readyState = this.connection.readyState;
    const isUp = readyState === 1;
    return {
      ok: true,
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      db: {
        ok: isUp,
        readyState,
        name: this.connection?.name,
      },
    };
  }
}



