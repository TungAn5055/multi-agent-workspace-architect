import { AgentRole } from '@prisma/client';

import { AppConfigService } from 'src/config/app-config.service';
import { ParticipantSelectorService } from 'src/orchestrator/participant-selector.service';

describe('ParticipantSelectorService', () => {
  const service = new ParticipantSelectorService({
    orchestratorMaxParticipants: 3,
  } as AppConfigService);

  const agents = [
    {
      id: 'lead-id',
      name: 'Lan',
      role: AgentRole.LEAD,
      description: 'Lead',
      isEnabled: true,
    },
    {
      id: 'researcher-id',
      name: 'Minh',
      role: AgentRole.RESEARCHER,
      description: 'Researcher',
      isEnabled: true,
    },
    {
      id: 'critic-id',
      name: 'An',
      role: AgentRole.CRITIC,
      description: 'Critic',
      isEnabled: true,
    },
  ];

  it('prioritizes mentioned agent and still keeps lead in the turn', () => {
    const participants = service.selectParticipants('@Minh đào sâu rủi ro kỹ thuật', agents);

    expect(participants[0]?.agentId).toBe('researcher-id');
    expect(participants.some((item) => item.agentId === 'lead-id')).toBe(true);
    expect(participants.length).toBeLessThanOrEqual(3);
  });

  it('does not force every agent to speak in a simple synthesis request', () => {
    const participants = service.selectParticipants('Lan hãy tóm tắt và chốt hướng', agents);

    expect(participants.some((item) => item.agentId === 'lead-id')).toBe(true);
    expect(participants.length).toBeLessThan(agents.length + 1);
  });
});
