export const ERROR_CODES = {
  unauthorized: 'UNAUTHORIZED',
  validationFailed: 'VALIDATION_FAILED',
  ownershipDenied: 'OWNERSHIP_DENIED',
  topicNotFound: 'TOPIC_NOT_FOUND',
  topicArchived: 'TOPIC_ARCHIVED',
  topicHistoryLocked: 'TOPIC_HISTORY_LOCKED',
  agentNameDuplicated: 'AGENT_NAME_DUPLICATED',
  activeRunExists: 'ACTIVE_RUN_EXISTS',
  runNotFound: 'RUN_NOT_FOUND',
  runNotActive: 'RUN_NOT_ACTIVE',
  runAlreadyCancelled: 'RUN_ALREADY_CANCELLED',
  invalidAgentRole: 'INVALID_AGENT_ROLE',
  llmRequestFailed: 'LLM_REQUEST_FAILED',
  openAiRequestFailed: 'LLM_REQUEST_FAILED',
  llmCredentialMissing: 'LLM_CREDENTIAL_MISSING',
  llmProviderUnsupported: 'LLM_PROVIDER_UNSUPPORTED',
  internalError: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
