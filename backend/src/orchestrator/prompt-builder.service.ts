import { Injectable } from '@nestjs/common';
import { AgentRole } from '@prisma/client';

import { WAITING_HUMAN_MARKER } from 'src/common/constants/app.constants';
import { PromptPayload } from 'src/orchestrator/orchestrator.types';

interface PromptAgent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
}

interface PromptMessage {
  senderName: string;
  senderType: string;
  contentMarkdown: string;
}

@Injectable()
export class PromptBuilderService {
  buildPrompt(input: {
    topic: { title: string; sharedModel: string };
    agent: PromptAgent;
    latestHumanMessage: string;
    recentMessages: PromptMessage[];
    previousStepOutputs: Array<{ agentName: string; contentMarkdown: string }>;
    stepGoal: string;
  }): PromptPayload {
    const isLead = input.agent.role === AgentRole.LEAD;

    const instructions = [
      'Bạn đang tham gia một cuộc thảo luận nhiều agent trong một workspace theo topic.',
      'Chỉ trả lời bằng tiếng Việt.',
      'Không được giả vờ có web search, nguồn ngoài hay dữ liệu thời gian thực nếu thực tế không có.',
      'Không lặp lại nguyên ý của agent trước nếu không thêm giá trị mới.',
      'Human là người quyết định cuối cùng, agent không được tự nhận quyền kết luận thay Human.',
      isLead
        ? `Nếu thật sự cần Human bổ sung thông tin, hãy chèn marker ${WAITING_HUMAN_MARKER} ở một dòng riêng rồi đặt câu hỏi ngắn gọn ngay sau đó.`
        : 'Bạn không được hỏi ngược Human. Nếu thiếu dữ kiện, hãy nêu giả định thay vì yêu cầu Human trả lời.',
    ].join('\n');

    const history = input.recentMessages
      .map(
        (message) =>
          `- ${message.senderName} [${message.senderType}]: ${message.contentMarkdown.trim()}`,
      )
      .join('\n');

    const currentRunOutputs = input.previousStepOutputs
      .map((output) => `- ${output.agentName}: ${output.contentMarkdown.trim()}`)
      .join('\n');

    const prompt = [
      `Topic: ${input.topic.title}`,
      `Model chung cho topic: ${input.topic.sharedModel}`,
      `Vai trò agent hiện tại: ${input.agent.name} (${input.agent.role.toLocaleLowerCase('en-US')})`,
      `Mô tả nhiệm vụ agent: ${input.agent.description}`,
      `Mục tiêu step hiện tại: ${input.stepGoal}`,
      'Luật bắt buộc:',
      '- Chỉ Lead mới được hỏi lại Human.',
      '- Không được kết luận thay Human.',
      '- V1 không có web search.',
      '- Nếu nhắc lại ý cũ, phải thêm góc nhìn mới hoặc phản biện rõ ràng.',
      `Latest human message:\n${input.latestHumanMessage.trim()}`,
      history ? `Recent history:\n${history}` : 'Recent history: chưa có.',
      currentRunOutputs ? `Các phát biểu trước đó trong run này:\n${currentRunOutputs}` : 'Trong run này bạn là người phát biểu đầu tiên.',
      'Đầu ra cần tạo: markdown rõ ràng, súc tích, có cấu trúc nếu phù hợp.',
    ].join('\n\n');

    return {
      instructions,
      prompt,
    };
  }
}
