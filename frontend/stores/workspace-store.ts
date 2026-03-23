import { create } from 'zustand';

import { MessageItem, RunStatus } from '@/types/topic';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface ActiveRunState {
  id: string;
  status: RunStatus;
  stopReason?: string | null;
}

interface CurrentSpeaker {
  agentId: string;
  agentName: string;
  stepId: string;
  messageId: string;
}

interface WorkspaceState {
  topicId: string | null;
  messages: MessageItem[];
  activeRun: ActiveRunState | null;
  currentSpeaker: CurrentSpeaker | null;
  waitingHuman: boolean;
  highlightedMessageId: string | null;
  connectionStatus: ConnectionStatus;
  banner: string | null;
  reset: (topicId: string) => void;
  hydrate: (topicId: string, messages: MessageItem[], activeRun: ActiveRunState | null) => void;
  upsertMessage: (message: MessageItem) => void;
  ensureStreamingMessage: (input: {
    topicId: string;
    runId: string;
    messageId: string;
    agentId: string;
    agentName: string;
    sequenceNo: number;
  }) => void;
  appendDelta: (messageId: string, delta: string) => void;
  completeMessage: (messageId: string, contentMarkdown: string) => void;
  setActiveRun: (activeRun: ActiveRunState | null) => void;
  setRunStatus: (status: RunStatus, stopReason?: string | null) => void;
  setCurrentSpeaker: (speaker: CurrentSpeaker | null) => void;
  setWaitingHuman: (messageId: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setBanner: (banner: string | null) => void;
}

function sortMessages(messages: MessageItem[]) {
  return [...messages].sort((left, right) => left.sequenceNo - right.sequenceNo);
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  topicId: null,
  messages: [],
  activeRun: null,
  currentSpeaker: null,
  waitingHuman: false,
  highlightedMessageId: null,
  connectionStatus: 'idle',
  banner: null,
  reset: (topicId) =>
    set({
      topicId,
      messages: [],
      activeRun: null,
      currentSpeaker: null,
      waitingHuman: false,
      highlightedMessageId: null,
      connectionStatus: 'idle',
      banner: null,
    }),
  hydrate: (topicId, messages, activeRun) =>
    set((state) => {
      if (state.topicId !== topicId) {
        return {
          topicId,
          messages: sortMessages(messages),
          activeRun,
          currentSpeaker: null,
          waitingHuman: activeRun?.status === 'waiting_human',
          highlightedMessageId: null,
          connectionStatus: state.connectionStatus,
          banner: null,
        };
      }

      return {
        messages: sortMessages(messages),
        activeRun,
        waitingHuman: activeRun?.status === 'waiting_human',
      };
    }),
  upsertMessage: (message) =>
    set((state) => {
      const existingIndex = state.messages.findIndex((item) => item.id === message.id);
      if (existingIndex >= 0) {
        const next = [...state.messages];
        next[existingIndex] = { ...next[existingIndex], ...message };
        return { messages: sortMessages(next) };
      }

      return { messages: sortMessages([...state.messages, message]) };
    }),
  ensureStreamingMessage: (input) =>
    set((state) => {
      const exists = state.messages.some((item) => item.id === input.messageId);
      if (exists) {
        return state;
      }

      const message: MessageItem = {
        id: input.messageId,
        topicId: input.topicId,
        runId: input.runId,
        senderType: 'agent',
        senderAgentId: input.agentId,
        senderName: input.agentName,
        contentMarkdown: '',
        mentions: [],
        status: 'streaming',
        sequenceNo: input.sequenceNo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        messages: sortMessages([...state.messages, message]),
      };
    }),
  appendDelta: (messageId, delta) =>
    set((state) => ({
      messages: state.messages.map((item) =>
        item.id === messageId
          ? {
              ...item,
              status: 'streaming',
              contentMarkdown: `${item.contentMarkdown}${delta}`,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    })),
  completeMessage: (messageId, contentMarkdown) =>
    set((state) => ({
      messages: state.messages.map((item) =>
        item.id === messageId
          ? {
              ...item,
              contentMarkdown,
              status: 'completed',
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    })),
  setActiveRun: (activeRun) =>
    set({
      activeRun,
      waitingHuman: activeRun?.status === 'waiting_human',
    }),
  setRunStatus: (status, stopReason) =>
    set((state) => ({
      activeRun: state.activeRun
        ? {
            ...state.activeRun,
            status,
            stopReason,
          }
        : null,
      waitingHuman: status === 'waiting_human',
    })),
  setCurrentSpeaker: (currentSpeaker) => set({ currentSpeaker }),
  setWaitingHuman: (messageId) =>
    set({
      waitingHuman: true,
      highlightedMessageId: messageId,
    }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setBanner: (banner) => set({ banner }),
}));
