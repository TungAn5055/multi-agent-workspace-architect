import { AgentRole } from '@prisma/client';

import { WAITING_HUMAN_MARKER } from 'src/common/constants/app.constants';
import { PromptBuilderService } from 'src/orchestrator/prompt-builder.service';

describe('PromptBuilderService', () => {
  const service = new PromptBuilderService();

  it('injects waiting-human marker rule only for lead', () => {
    const leadPrompt = service.buildPrompt({
      topic: {
        title: 'Topic A',
        sharedProvider: 'openrouter',
        sharedModel: 'gpt-5',
      },
      agent: {
        id: '1',
        name: 'Lan',
        role: AgentRole.LEAD,
        description: 'Lead',
      },
      execution: {
        provider: 'openrouter',
        model: 'gpt-5',
      },
      latestHumanMessage: 'Cho tôi phương án khả thi.',
      recentMessages: [],
      previousStepOutputs: [],
      stepGoal: 'Tổng hợp.',
    });

    const assistantPrompt = service.buildPrompt({
      topic: {
        title: 'Topic A',
        sharedProvider: 'openrouter',
        sharedModel: 'gpt-5',
      },
      agent: {
        id: '2',
        name: 'Minh',
        role: AgentRole.ASSISTANT,
        description: 'Assistant',
      },
      execution: {
        provider: 'openrouter',
        model: 'gpt-5',
      },
      latestHumanMessage: 'Cho tôi phương án khả thi.',
      recentMessages: [],
      previousStepOutputs: [],
      stepGoal: 'Mở đầu.',
    });

    expect(leadPrompt.instructions).toContain(WAITING_HUMAN_MARKER);
    expect(assistantPrompt.instructions).toContain('Bạn không được hỏi ngược Human');
  });
});
