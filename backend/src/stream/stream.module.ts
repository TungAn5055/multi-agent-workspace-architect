import { Module } from '@nestjs/common';

import { StreamController } from 'src/stream/stream.controller';
import { StreamService } from 'src/stream/stream.service';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [TopicsModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
