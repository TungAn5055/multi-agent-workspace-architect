-- Create enums
CREATE TYPE "TopicStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "AgentRole" AS ENUM ('lead', 'assistant', 'researcher', 'critic');
CREATE TYPE "SenderType" AS ENUM ('human', 'agent', 'system');
CREATE TYPE "RunStatus" AS ENUM ('queued', 'running', 'waiting_human', 'completed', 'failed', 'cancelled');
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'streaming', 'completed', 'failed');
CREATE TYPE "RunStepStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE "topics" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "TopicStatus" NOT NULL DEFAULT 'draft',
  "shared_model" TEXT NOT NULL,
  "first_message_at" TIMESTAMP(3),
  "next_sequence_no" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "topic_agents" (
  "id" UUID NOT NULL,
  "topic_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "name_normalized" TEXT NOT NULL,
  "role" "AgentRole" NOT NULL,
  "description" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "topic_agents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
  "id" UUID NOT NULL,
  "topic_id" UUID NOT NULL,
  "run_id" UUID,
  "client_request_id" TEXT,
  "sender_type" "SenderType" NOT NULL,
  "sender_agent_id" UUID,
  "sender_name" TEXT NOT NULL,
  "content_markdown" TEXT NOT NULL,
  "mentions_json" JSONB,
  "status" "MessageStatus" NOT NULL DEFAULT 'completed',
  "sequence_no" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "runs" (
  "id" UUID NOT NULL,
  "topic_id" UUID NOT NULL,
  "trigger_message_id" UUID NOT NULL,
  "status" "RunStatus" NOT NULL DEFAULT 'queued',
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "stop_reason" TEXT,
  "error_message" TEXT,
  "total_input_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_output_tokens" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "run_steps" (
  "id" UUID NOT NULL,
  "run_id" UUID NOT NULL,
  "step_index" INTEGER NOT NULL,
  "agent_id" UUID,
  "action_type" TEXT NOT NULL DEFAULT 'agent_response',
  "status" "RunStepStatus" NOT NULL DEFAULT 'pending',
  "model" TEXT NOT NULL,
  "latency_ms" INTEGER,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "prompt_snapshot" JSONB NOT NULL,
  "response_snapshot" JSONB,
  "stop_reason" TEXT,
  "message_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "run_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "topic_agents_topic_id_name_normalized_key" ON "topic_agents"("topic_id", "name_normalized");
CREATE UNIQUE INDEX "messages_topic_id_client_request_id_key" ON "messages"("topic_id", "client_request_id");
CREATE UNIQUE INDEX "messages_topic_id_sequence_no_key" ON "messages"("topic_id", "sequence_no");
CREATE UNIQUE INDEX "run_steps_message_id_key" ON "run_steps"("message_id");
CREATE UNIQUE INDEX "runs_trigger_message_id_key" ON "runs"("trigger_message_id");
CREATE UNIQUE INDEX "runs_one_active_per_topic_idx" ON "runs"("topic_id") WHERE "status" IN ('queued', 'running', 'waiting_human');

CREATE INDEX "topics_user_id_status_idx" ON "topics"("user_id", "status");
CREATE INDEX "topic_agents_topic_id_sort_order_idx" ON "topic_agents"("topic_id", "sort_order");
CREATE INDEX "messages_topic_id_sequence_no_idx" ON "messages"("topic_id", "sequence_no");
CREATE INDEX "messages_run_id_idx" ON "messages"("run_id");
CREATE INDEX "runs_topic_id_status_idx" ON "runs"("topic_id", "status");
CREATE INDEX "runs_topic_id_created_at_idx" ON "runs"("topic_id", "created_at");
CREATE INDEX "run_steps_run_id_step_index_idx" ON "run_steps"("run_id", "step_index");
CREATE INDEX "run_steps_agent_id_idx" ON "run_steps"("agent_id");

ALTER TABLE "topic_agents"
  ADD CONSTRAINT "topic_agents_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "runs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_sender_agent_id_fkey"
  FOREIGN KEY ("sender_agent_id") REFERENCES "topic_agents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "runs"
  ADD CONSTRAINT "runs_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "runs"
  ADD CONSTRAINT "runs_trigger_message_id_fkey"
  FOREIGN KEY ("trigger_message_id") REFERENCES "messages"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "run_steps"
  ADD CONSTRAINT "run_steps_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "run_steps"
  ADD CONSTRAINT "run_steps_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "topic_agents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "run_steps"
  ADD CONSTRAINT "run_steps_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
