import { AgentRole, MessageStatus, RunStatus, SenderType, TopicStatus } from '@prisma/client';

import { toApiEnum } from 'src/common/utils/enum-mapper';

export function mapTopicStatus(status: TopicStatus): string {
  return toApiEnum(status);
}

export function mapAgentRole(role: AgentRole): string {
  return toApiEnum(role);
}

export function mapMessageStatus(status: MessageStatus): string {
  return toApiEnum(status);
}

export function mapRunStatus(status: RunStatus): string {
  return toApiEnum(status);
}

export function mapSenderType(senderType: SenderType): string {
  return toApiEnum(senderType);
}
