# Technical Baseline Specification

This file captures the recommended implementation baseline for the locked product decisions.

## 1. Product summary
Build a standalone multi-agent workspace where a human creates a topic, configures named AI agents, and starts the discussion by sending the first message. The backend orchestrates which agents participate in each run. The UI shows the full multi turn exchange. The human remains the final decision maker.

## 2. Recommended stack
### Frontend
- Next.js
- Tailwind CSS
- TanStack Query for server state
- Zustand for transient chat and run UI state
- SSE client for streaming
- Markdown renderer with safe sanitization

### Backend
- NestJS
- PostgreSQL
- Prisma or Drizzle
- Redis
- BullMQ
- SSE endpoint for per topic event streaming

## 3. Main screens
### Topic list
- list topics
- create topic
- search and archive filters

### Topic builder
- title input
- custom agent list
- add, remove, reorder agent
- role select
- description editor
- create action

### Topic workspace
- message timeline
- composer
- run status bar
- stop button
- agent roster sidebar
- topic metadata panel

## 4. Frontend state model
### Server state
- topic list
- topic detail
- agent list
- paginated messages
- current run status

### Local state
- draft composer input
- active run id
- streaming buffer per message
- sidebar selection
- optimistic pending message state

## 5. Backend modules
### TopicsService
Create, read, update title, archive topic.

### AgentsService
Create, list, reorder, and validate immutability after first message.

### MessagesService
Persist human, agent, and system messages. Support pagination and ordering.

### RunsService
Create run, track status, cancel run, record stop reason.

### OrchestratorService
Choose participants, build context, execute steps, decide next action, and manage waiting for human.

### LlmGatewayService
Call the shared model, handle retries, timeouts, logging, structured outputs, and streaming.

### SseGateway
Publish run events to the topic workspace.

## 6. Suggested database model
### topics
- id
- user_id
- title
- status
- created_at
- updated_at
- first_message_at nullable

### topic_agents
- id
- topic_id
- name
- role
- description
- sort_order
- model
- is_enabled
- created_at

### messages
- id
- topic_id
- run_id nullable
- sender_type
- sender_agent_id nullable
- sender_name
- content_markdown
- mentions_json
- status
- sequence_no
- created_at

### runs
- id
- topic_id
- trigger_message_id
- status
- started_at
- finished_at nullable
- stop_reason nullable
- total_input_tokens
- total_output_tokens

### run_steps
- id
- run_id
- step_index
- agent_id
- action_type
- status
- model
- latency_ms
- input_tokens
- output_tokens
- prompt_snapshot
- response_snapshot
- created_at

## 7. Status model
### topic status
- draft
- active
- archived

### run status
- queued
- running
- waiting_human
- completed
- failed
- cancelled

### message status
- pending
- streaming
- completed
- failed

## 8. Core workflow
### Create topic
1. Human enters topic title.
2. Human adds at least two agents.
3. Backend saves topic and agent configuration.
4. No run starts yet.

### Start first run
1. Human sends first message.
2. Backend persists the human message.
3. Backend creates a run and enqueues orchestration work.
4. Worker loads topic, agents, and recent context.
5. Orchestrator selects participants.
6. Backend calls the model step by step.
7. SSE streams agent output to the client.
8. Backend persists step results and messages.
9. Run ends as completed or waiting_human.

## 9. Orchestration policy
Use a participant selective policy rather than fixed round robin.

### Default step order
1. Read the latest human message and topic context.
2. If the human tagged a specific agent, prioritize that agent.
3. Choose one scout style agent first when evidence gathering or exploration is needed.
4. Optionally choose one additional agent to critique or extend.
5. Let the lead synthesize, highlight gaps, or ask the human a follow up question.
6. Stop.

### Default limits
- 1 active run per topic
- 1 to 3 agent response steps per run by default
- configurable max turn count and token budget

### Stop conditions
- no useful next participant
- lead asked the human a follow up question
- max turns reached
- max tokens reached
- user pressed stop
- unrecoverable model failure

## 10. Human tagging behavior
Allow user input such as `@Linh đào sâu phần rủi ro`. The orchestrator should parse tagged agent names and boost their participation priority for the current run.

## 11. Prompt architecture
Use four layers.

### Layer 1. Platform rules
Shared rules for all agents.
- participate in a multi-agent discussion
- avoid repeating the previous message without adding value
- keep the response readable in markdown
- only the lead may ask the human a question
- do not claim final authority over the decision

### Layer 2. Topic contract
- topic title
- objective of the discussion
- constraints
- current run rules

### Layer 3. Agent persona
- name
- role
- description
- style and responsibility boundaries

### Layer 4. Runtime turn brief
- latest human message
- short recent history summary
- previous agent outputs in the current run
- step goal for the current agent

## 12. Structured output recommendation
Ask the model for a machine friendly response that can be converted into a visible chat message.

Suggested fields:
- public_message
- mentions
- needs_human_input
- should_continue
- confidence

Render only `public_message` in the chat UI. Use the rest for orchestration decisions.

## 13. Streaming events
Use SSE with events similar to:
- run.started
- agent.started
- agent.delta
- agent.completed
- run.waiting_human
- run.completed
- run.failed

## 14. Minimum API surface
### Topics
- POST /topics
- GET /topics
- GET /topics/:id
- PATCH /topics/:id
- POST /topics/:id/archive

### Agents
- POST /topics/:id/agents
- PATCH /topics/:id/agents/:agentId
- DELETE /topics/:id/agents/:agentId
- POST /topics/:id/agents/reorder

### Messages and runs
- GET /topics/:id/messages
- POST /topics/:id/messages
- GET /topics/:id/runs/:runId
- POST /topics/:id/runs/:runId/cancel
- GET /topics/:id/stream

## 15. Validation rules
### Topic
- title required
- at least two agents required
- only owner can change or archive the topic

### Agent
- name required
- role required
- description required
- unique name per topic recommended
- prompt becomes immutable after the first message exists

### Run
- reject new run if another run is active in the same topic
- reject agent edits when topic history already exists

## 16. Main risks
- agents sounding too similar
- repeated content across steps
- token growth from long history
- race conditions from repeated send clicks
- ordering bugs during streaming and retries
- partial failures leaving the run in an inconsistent state

## 17. Reliability controls
- lock one active run per topic
- persist every run step
- store sequence numbers for messages
- retry transient model failures once
- record stop reason and error message
- allow manual cancel

## 18. MVP roadmap
### Sprint 1
- topic builder
- agent CRUD before first message
- message timeline
- single run creation
- basic orchestration with two agents

### Sprint 2
- participant selection
- lead follow up question path
- SSE streaming
- stop and waiting_human states
- usage and error logging

### Sprint 3
- immutability enforcement
- run detail debug view
- richer validation and retry behavior
- polish and production hardening
