import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { HealthService } from 'src/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return toEnvelope(await this.healthService.getHealth());
  }
}
