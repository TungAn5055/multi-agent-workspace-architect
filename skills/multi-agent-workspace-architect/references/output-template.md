# Default Output Template

Use this structure for requirement analysis and technical specification unless the user requests another format.

## 1. Confirmed requirements
List only decisions explicitly confirmed by the user.

## 2. Assumptions and boundaries
List inferred defaults and clearly mark them as assumptions.

## 3. Product behavior
Describe:
- topic creation
- topic start condition
- agent behavior
- human control points
- stop and waiting states

## 4. Frontend design
Describe:
- screens
- key components
- client state
- streaming behavior
- validation and UX rules

## 5. Backend design
Describe:
- services and modules
- job and queue flow
- orchestration engine
- persistence strategy
- observability

## 6. Data model
Describe the core tables or collections and why they exist.

## 7. Orchestration algorithm
Describe:
- run creation
- participant selection
- step execution
- stop conditions
- waiting for human behavior

## 8. LLM integration
Describe:
- how the backend calls the model
- prompt layers
- structured output expectations
- streaming path
- cost and reliability controls

## 9. API contracts
Describe the minimum endpoints for topic, agent, message, run, and stream handling.

## 10. Risks and edge cases
Call out repetition, race conditions, token growth, failure recovery, and UI ordering.

## 11. MVP roadmap
Break delivery into a few realistic phases or sprints.
