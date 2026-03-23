import { Injectable } from '@nestjs/common';
import { AgentRole } from '@prisma/client';

import { AppConfigService } from 'src/config/app-config.service';
import { detectMentions } from 'src/common/utils/mentions';
import { ParticipantDecision } from 'src/orchestrator/orchestrator.types';

interface AgentShape {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  isEnabled: boolean;
}

@Injectable()
export class ParticipantSelectorService {
  constructor(private readonly appConfig: AppConfigService) {}

  selectParticipants(latestHumanMessage: string, agents: AgentShape[]): ParticipantDecision[] {
    const enabledAgents = agents.filter((agent) => agent.isEnabled);
    const maxParticipants = this.appConfig.orchestratorMaxParticipants;
    const decisions: ParticipantDecision[] = [];
    const selected = new Set<string>();

    const mentions = detectMentions(
      latestHumanMessage,
      enabledAgents.map((agent) => ({ id: agent.id, name: agent.name })),
    );

    for (const mention of mentions) {
      const agent = enabledAgents.find((item) => item.id === mention.agentId);
      if (!agent || selected.has(agent.id)) {
        continue;
      }

      decisions.push({
        agentId: agent.id,
        stepGoal: `Ưu tiên phản hồi vì Human đã tag trực tiếp @${agent.name}.`,
      });
      selected.add(agent.id);
      if (decisions.length >= maxParticipants) {
        return decisions;
      }
    }

    const lowered = latestHumanMessage.toLocaleLowerCase('vi-VN');
    const lead = enabledAgents.find((agent) => agent.role === AgentRole.LEAD);
    const researcher = enabledAgents.find((agent) => agent.role === AgentRole.RESEARCHER);
    const assistant = enabledAgents.find((agent) => agent.role === AgentRole.ASSISTANT);
    const critic = enabledAgents.find((agent) => agent.role === AgentRole.CRITIC);

    const exploratory = /(đào sâu|nghiên cứu|phân tích|so sánh|khai triển|chi tiết|rủi ro)/i.test(lowered);
    const synthesis = /(tóm tắt|kết luận|chốt|đề xuất cuối|định hướng|quyết định)/i.test(lowered);
    const riskFocused = /(rủi ro|phản biện|điểm yếu|nguy cơ|trade[- ]?off)/i.test(lowered);

    const maybePush = (agent: AgentShape | undefined, stepGoal: string) => {
      if (!agent || selected.has(agent.id) || decisions.length >= maxParticipants) {
        return;
      }
      decisions.push({ agentId: agent.id, stepGoal });
      selected.add(agent.id);
    };

    if (exploratory) {
      maybePush(researcher ?? assistant, 'Đào sâu dữ kiện, giả định và hướng khai triển cho yêu cầu hiện tại.');
    } else {
      maybePush(assistant ?? researcher, 'Phản hồi mở đầu và cấu trúc vấn đề để các bước sau kế thừa.');
    }

    if (riskFocused) {
      maybePush(critic, 'Phản biện, chỉ ra rủi ro và chỗ còn thiếu chứng cứ.');
    }

    if (synthesis || decisions.length === 0 || lead) {
      maybePush(
        lead,
        synthesis
          ? 'Tổng hợp, chốt hướng và nêu rõ quyết định hoặc bước tiếp theo.'
          : 'Điều phối, tổng hợp và quyết định có cần hỏi lại Human hay không.',
      );
    }

    if (decisions.length === 0 && enabledAgents.length > 0) {
      maybePush(enabledAgents[0], 'Trả lời bước đầu cho yêu cầu hiện tại.');
    }

    if (lead && !selected.has(lead.id) && decisions.length < maxParticipants) {
      maybePush(lead, 'Tổng hợp cuối cùng cho lượt này.');
    }

    return decisions.slice(0, maxParticipants);
  }
}
