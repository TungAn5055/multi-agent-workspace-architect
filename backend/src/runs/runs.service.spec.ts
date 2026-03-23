import { MessageStatus, SenderType } from '@prisma/client';
import { Queue } from 'bullmq';

import { AppException } from 'src/common/exceptions/app.exception';
import { AppConfigService } from 'src/config/app-config.service';
import { ObservabilityService } from 'src/observability/observability.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RunExecutionRegistryService } from 'src/runs/run-execution-registry.service';
import { RunsRepository } from 'src/runs/runs.repository';
import { RunsService } from 'src/runs/runs.service';
import { StreamService } from 'src/stream/stream.service';
import { TopicsService } from 'src/topics/topics.service';

describe('RunsService', () => {
  it('rejects a new human message when another run is active', async () => {
    const runsRepository = {
      lockTopic: jest.fn(),
      findActiveRun: jest.fn().mockResolvedValue({
        id: 'run-1',
        status: 'RUNNING',
      }),
    } as unknown as RunsRepository;

    const service = new RunsService(
      {
        assertOwnedTopic: jest.fn().mockResolvedValue({
          id: 'topic-1',
          userId: 'demo-user',
          status: 'ACTIVE',
          firstMessageAt: new Date(),
        }),
      } as unknown as TopicsService,
      {
        markActivated: jest.fn(),
      } as never,
      {
        assertOwner: jest.fn(),
      } as never,
      {
        listByTopic: jest.fn().mockResolvedValue([
          {
            id: 'agent-1',
            name: 'Lan',
          },
        ]),
      } as never,
      {
        findByClientRequestId: jest.fn().mockResolvedValue(null),
        allocateSequenceNo: jest.fn(),
        createMessage: jest.fn(),
      } as never,
      runsRepository,
      {
        $transaction: async (callback: (tx: object) => Promise<unknown>) => callback({}),
      } as PrismaService,
      {
        queueRunAttempts: 2,
      } as AppConfigService,
      {
        publish: jest.fn(),
      } as unknown as StreamService,
      {
        increment: jest.fn(),
      } as unknown as ObservabilityService,
      new RunExecutionRegistryService(),
      {
        add: jest.fn(),
      } as unknown as Queue,
    );

    await expect(
      service.createRunFromHumanMessage('topic-1', 'demo-user', {
        contentMarkdown: 'Tin nhắn mới',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
