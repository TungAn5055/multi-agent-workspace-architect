export interface MentionInfo {
  agentId: string;
  agentName: string;
}

export function detectMentions(
  content: string,
  agents: Array<{ id: string; name: string }>,
): MentionInfo[] {
  const loweredContent = content.toLocaleLowerCase('vi-VN');

  return agents
    .filter((agent) => loweredContent.includes(`@${agent.name.toLocaleLowerCase('vi-VN')}`))
    .map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
    }));
}
