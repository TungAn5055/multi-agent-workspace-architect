import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { TopicsController } from 'src/topics/topics.controller';
import { TopicsRepository } from 'src/topics/topics.repository';
import { TopicsService } from 'src/topics/topics.service';

@Module({
  imports: [AuthModule],
  controllers: [TopicsController],
  providers: [TopicsRepository, TopicsService],
  exports: [TopicsRepository, TopicsService],
})
export class TopicsModule {}
