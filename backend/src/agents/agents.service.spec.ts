import { AgentsService } from 'src/agents/agents.service';
import { AppException } from 'src/common/exceptions/app.exception';
import { PrismaService } from 'src/prisma/prisma.service';
import { TopicsRepository } from 'src/topics/topics.repository';
import { TopicsService } from 'src/topics/topics.service';

describe('AgentsService', () => {
  it('locks agent mutations after topic has history', async () => {
    const service = new AgentsService(
      {} as never,
      {
        assertOwnedTopic: jest.fn().mockResolvedValue({
          id: 'topic-1',
          userId: 'demo-user',
          status: 'ACTIVE',
        }),
      } as unknown as TopicsService,
      {
        hasHistory: jest.fn().mockResolvedValue(true),
      } as unknown as TopicsRepository,
      {} as PrismaService,
    );

    await expect(service.assertTopicCanMutateAgents('topic-1', 'demo-user')).rejects.toBeInstanceOf(
      AppException,
    );
  });
});
