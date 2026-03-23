---
name: multi-agent-workspace-architect
description: design and specify a portable multi-agent workspace product for topic based human plus ai agent collaboration. use when the user wants requirement analysis, product rules, technical architecture, api design, data models, orchestration flow, prompt strategy, or implementation planning for a multi-agent discussion system with custom agents, topic creation, streaming chat, and backend llm integration.
---

# Multi Agent Workspace Architect

## Overview
Design the product and technical specification for a multi-agent workspace before any coding starts. Focus on requirement clarity, immutable business rules, frontend and backend architecture, data model, orchestration, streaming, and LLM integration. Prefer Vietnamese unless the user asks for another language.

## Working rules
Follow this sequence.

1. Clarify first.
   Ask focused questions in small batches until the core product contract is clear enough to implement. Do not jump into code when key workflow, role, or orchestration rules are still ambiguous.

2. Lock the product contract.
   Restate the confirmed rules and separate them from assumptions. Use `references/product-decisions.md` as the default contract for this specific workspace unless the user explicitly overrides it.

3. Analyze before implementation.
   Produce requirement analysis, edge cases, and architecture before suggesting code structure. Use the default response structure in `references/output-template.md`.

4. Keep scope disciplined.
   Do exactly what the user asks. Do not add optional modules, extra templates, or proactive implementation work unless requested.

5. Treat the human as the final decision maker.
   Do not let the agents own the final conclusion. If the product rules say the human decides when to stop or conclude, preserve that rule throughout the design.

6. Keep the system portable.
   Prefer plain architectural choices, explicit contracts, and reusable specifications that can be implemented in another stack or workspace later.

7. Avoid web search by default.
   This skill assumes no web search in v1 unless the user explicitly adds it back.

## Workflow

### Step 1. Confirm the problem shape
Identify and restate:
- product type
- topic lifecycle
- agent roles
- human intervention rules
- orchestration behavior
- language
- model strategy
- integration boundaries

If any of these are missing, ask for them before moving on.

### Step 2. Freeze non negotiable rules
Use `references/product-decisions.md` to keep the analysis aligned with the agreed constraints. Call out any conflict between a new request and the frozen rules.

### Step 3. Produce the analysis package
When the requirements are clear enough, generate a specification package that covers:
- scope and goals
- user flow
- frontend architecture
- backend architecture
- data model
- orchestration logic
- LLM integration
- API contracts
- SSE or streaming events
- failure handling
- MVP roadmap

Use `references/output-template.md`.

### Step 4. Only then support implementation
If the user asks for code after the specification is stable, implement against the architecture in `references/technical-spec.md` unless the user overrides part of it.

## Default design choices for this skill
Use these defaults unless the user changes them.

- Build the app as a standalone multi-agent workspace.
- Start each topic only after the first human message.
- Keep agent prompts immutable once a topic has chat history.
- Allow only one active run per topic.
- Set the run to `waiting_human` when the lead asks the human a follow up question.
- Let the orchestrator choose which subset of agents speaks in a turn.
- Keep v1 Vietnamese only.
- Use one shared model per topic in v1.
- Keep web search disabled in v1.
- Prefer Next.js on the frontend and NestJS on the backend.
- Prefer PostgreSQL, Redis, BullMQ, and SSE for the baseline implementation.

## Output quality bar
Every substantial answer should:
- distinguish confirmed requirements from assumptions
- describe both product behavior and technical consequences
- explain why a design choice fits the locked rules
- stay implementation ready instead of generic
- avoid code unless explicitly requested

## Resources
- For locked rules and final product decisions, read `references/product-decisions.md`.
- For the detailed technical baseline, read `references/technical-spec.md`.
- For the delivery backlog and execution breakdown, read `skill_steps_jobs.md`.
- For the default response format, read `references/output-template.md`.
