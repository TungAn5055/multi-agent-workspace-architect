export interface ParticipantDecision {
  agentId: string;
  stepGoal: string;
}

export interface PromptPayload {
  instructions: string;
  prompt: string;
}
