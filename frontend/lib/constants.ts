import { AgentRole } from '@/types/topic';

export const AGENT_ROLE_OPTIONS: Array<{
  value: AgentRole;
  label: string;
  hint: string;
}> = [
  {
    value: 'lead',
    label: 'Lead',
    hint: 'Tổng hợp, điều phối và là người duy nhất có thể hỏi ngược Human.',
  },
  {
    value: 'assistant',
    label: 'Assistant',
    hint: 'Mở đầu, triển khai ý chính và giữ nhịp thảo luận.',
  },
  {
    value: 'researcher',
    label: 'Researcher',
    hint: 'Đào sâu giả định, rủi ro và chi tiết cần làm rõ.',
  },
  {
    value: 'critic',
    label: 'Critic',
    hint: 'Phản biện, soi khoảng trống và chặn kết luận non.',
  },
];
