export type TopicStatus = 'draft' | 'active' | 'archived';
export type AgentRole = 'lead' | 'assistant' | 'researcher' | 'critic';
export type RunStatus =
  | 'queued'
  | 'running'
  | 'waiting_human'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'failed';
export type SenderType = 'human' | 'agent' | 'system';

export interface TopicSummary {
  id: string;
  title: string;
  status: TopicStatus;
  sharedModel: string;
  agentCount: number;
  hasHistory: boolean;
  latestRunStatus: RunStatus | null;
  updatedAt: string;
  createdAt: string;
}

export interface TopicAgent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDetail {
  id: string;
  title: string;
  status: TopicStatus;
  sharedModel: string;
  hasHistory: boolean;
  firstMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeRun: {
    id: string;
    status: RunStatus;
    createdAt: string;
  } | null;
  agents: TopicAgent[];
}

export interface MessageItem {
  id: string;
  topicId: string;
  runId: string | null;
  senderType: SenderType;
  senderAgentId: string | null;
  senderName: string;
  contentMarkdown: string;
  mentions: Array<{ agentId: string; agentName: string }>;
  status: MessageStatus;
  sequenceNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  items: MessageItem[];
  nextCursor: number | null;
}

export interface RunDetail {
  id: string;
  topicId: string;
  triggerMessageId: string;
  status: RunStatus;
  stopReason: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  createdAt: string;
  updatedAt: string;
  steps: Array<{
    id: string;
    stepIndex: number;
    agentId: string | null;
    agentName: string | null;
    status: string;
    actionType: string;
    model: string;
    latencyMs: number | null;
    inputTokens: number;
    outputTokens: number;
    stopReason: string | null;
    messageId: string | null;
    createdAt: string;
  }>;
}

export interface CreateTopicPayload {
  title: string;
  model?: string;
  agents: Array<{
    name: string;
    role: AgentRole;
    description: string;
    isEnabled?: boolean;
  }>;
}

export interface UpdateTopicTitlePayload {
  title: string;
}

export interface AddAgentPayload {
  name: string;
  role: AgentRole;
  description: string;
  isEnabled?: boolean;
}

export interface UpdateAgentPayload extends Partial<AddAgentPayload> {}

export interface ReorderAgentsPayload {
  agentIds: string[];
}

export interface PostHumanMessagePayload {
  contentMarkdown: string;
  clientRequestId?: string;
}

export interface CreateRunResponse {
  reused: boolean;
  message: MessageItem;
  run: {
    id: string;
    topicId: string;
    status: RunStatus;
    createdAt: string;
  };
}

export interface CancelRunPayload {
  reason?: string;
}

export interface RunEventMap {
  connected: { topicId: string; connectedAt: string };
  ping: { topicId: string; timestamp: string };
  'run.queued': { runId: string; topicId: string; triggerMessageId: string; status: RunStatus };
  'run.started': { runId: string; topicId: string; triggerMessageId: string; status: RunStatus };
  'agent.started': {
    runId: string;
    topicId: string;
    stepId: string;
    agentId: string;
    agentName: string;
    messageId: string;
    sequenceNo: number;
  };
  'agent.delta': { runId: string; topicId: string; stepId: string; messageId: string; delta: string };
  'agent.completed': {
    runId: string;
    topicId: string;
    stepId: string;
    agentId: string;
    agentName: string;
    messageId: string;
    contentMarkdown: string;
    inputTokens: number;
    outputTokens: number;
  };
  'run.waiting_human': { runId: string; topicId: string; status: RunStatus; messageId: string };
  'run.completed': { runId: string; topicId: string; status: RunStatus };
  'run.failed': { runId: string; topicId: string; status: RunStatus; errorMessage: string };
  'run.cancelled': { runId: string; topicId: string; status: RunStatus; stopReason: string };
}
