# Locked Product Decisions

These are the agreed defaults for this skill.

## Product shape
- The product is a standalone app, not just a sub feature inside an existing chat app.
- The core interaction is one human plus multiple AI agents inside a topic based workspace.
- The value comes from visible multi turn discussion, not only a single final answer.

## Topic lifecycle
- Creating a topic only saves configuration.
- A topic does not auto run after creation.
- The first run starts only after the human sends the first message.
- Only one run can be active in a topic at a time.

## Agent rules
- Each agent has a name, role, description, order, enabled state, and shared model setting.
- The lead role is a prompt difference only.
- The lead does not own the final conclusion.
- Only the human decides when to stop or conclude.
- Only the lead may ask the human a follow up question.
- Agent prompts become immutable after the topic has message history.
- If the user wants different prompts later, create a new topic.

## Orchestration rules
- Not every agent must reply on every turn.
- The backend orchestrator chooses the participating subset of agents.
- Multi turn agent discussion must be visible in the UI.
- If the lead asks the human something, the run status becomes `waiting_human`.
- User input may tag a specific agent.

## Scope rules for v1
- No web search.
- Vietnamese only.
- One shared model per topic.
- Custom configuration is allowed. Do not assume a small fixed template list.

## Technology defaults
- Frontend: Next.js or React based client.
- Backend: Node.js with NestJS.
- Streaming: SSE by default.
- Persistence: PostgreSQL.
- Queue and coordination: Redis plus BullMQ.
