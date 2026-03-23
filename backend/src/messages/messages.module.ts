import { Module } from '@nestjs/common';

import { MessagesController } from 'src/messages/messages.controller';
import { MessagesRepository } from 'src/messages/messages.repository';
import { MessagesService } from 'src/messages/messages.service';
import { RunsModule } from 'src/runs/runs.module';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [TopicsModule, RunsModule],
  controllers: [MessagesController],
  providers: [MessagesRepository, MessagesService],
  exports: [MessagesRepository, MessagesService],
})
export class MessagesModule {}
