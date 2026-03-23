export const ACTIVE_RUN_STATUSES = ['queued', 'running', 'waiting_human'] as const;
export const RUNS_QUEUE = 'run-processing';
export const WAITING_HUMAN_MARKER = '<!--WAITING_HUMAN-->';

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
export const MIN_TOPIC_AGENTS = 2;
export const MAX_TOPIC_AGENTS = 5;

export const AGENT_ROLE_VALUES = ['lead', 'assistant', 'researcher', 'critic'] as const;
export const TOPIC_STATUS_VALUES = ['draft', 'active', 'archived'] as const;
export const MESSAGE_STATUS_VALUES = ['pending', 'streaming', 'completed', 'failed'] as const;
export const RUN_STATUS_VALUES = [
  'queued',
  'running',
  'waiting_human',
  'completed',
  'failed',
  'cancelled',
] as const;
