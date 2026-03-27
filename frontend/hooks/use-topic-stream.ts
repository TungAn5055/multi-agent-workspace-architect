'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { topicKeys } from '@/features/topics/topic-queries';
import { API_BASE_URL, USER_ID } from '@/lib/env';
import { useToastStore } from '@/stores/toast-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { RunEventMap } from '@/types/topic';

function parseEvent<T>(event: MessageEvent<string>) {
  return JSON.parse(event.data) as T;
}

function asEventListener(handler: (event: MessageEvent<string>) => void | Promise<void>) {
  return handler as unknown as EventListener;
}

export function useTopicStream(topicId: string) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.push);
  const ensureStreamingMessage = useWorkspaceStore((state) => state.ensureStreamingMessage);
  const appendDelta = useWorkspaceStore((state) => state.appendDelta);
  const completeMessage = useWorkspaceStore((state) => state.completeMessage);
  const setActiveRun = useWorkspaceStore((state) => state.setActiveRun);
  const setRunStatus = useWorkspaceStore((state) => state.setRunStatus);
  const setCurrentSpeaker = useWorkspaceStore((state) => state.setCurrentSpeaker);
  const setWaitingHuman = useWorkspaceStore((state) => state.setWaitingHuman);
  const setConnectionStatus = useWorkspaceStore((state) => state.setConnectionStatus);
  const setBanner = useWorkspaceStore((state) => state.setBanner);

  useEffect(() => {
    if (!topicId) {
      return;
    }

    setConnectionStatus('connecting');
    const eventSource = new EventSource(
      `${API_BASE_URL}/topics/${topicId}/stream?userId=${encodeURIComponent(USER_ID)}`,
    );

    const onConnected = (event: MessageEvent<string>) => {
      parseEvent<RunEventMap['connected']>(event);
      setConnectionStatus('connected');
    };

    const onQueued = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.queued']>(event);
      setActiveRun({ id: payload.runId, status: payload.status });
      setBanner('Run mới đã vào hàng đợi.');
      void queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) });
    };

    const onStarted = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.started']>(event);
      setActiveRun({ id: payload.runId, status: payload.status });
      setBanner('Hệ thống đang điều phối agent.');
    };

    const onAgentStarted = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['agent.started']>(event);
      ensureStreamingMessage({
        topicId,
        runId: payload.runId,
        messageId: payload.messageId,
        agentId: payload.agentId,
        agentName: payload.agentName,
        sequenceNo: payload.sequenceNo,
      });
      setCurrentSpeaker({
        agentId: payload.agentId,
        agentName: payload.agentName,
        stepId: payload.stepId,
        messageId: payload.messageId,
      });
      setBanner(`${payload.agentName} đang phát biểu...`);
    };

    const onAgentDelta = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['agent.delta']>(event);
      appendDelta(payload.messageId, payload.delta);
    };

    const onAgentCompleted = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['agent.completed']>(event);
      completeMessage(payload.messageId, payload.contentMarkdown);
      setCurrentSpeaker(null);
      void queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, payload.runId) });
    };

    const onWaitingHuman = (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.waiting_human']>(event);
      setRunStatus(payload.status);
      setWaitingHuman(payload.messageId);
      setCurrentSpeaker(null);
      setBanner('Hệ thống đang chờ bạn phản hồi.');
    };

    const onCompleted = async (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.completed']>(event);
      setRunStatus(payload.status);
      setCurrentSpeaker(null);
      setBanner('Run đã hoàn tất.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.messages(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, payload.runId) }),
      ]);
    };

    const onFailed = async (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.failed']>(event);
      setRunStatus(payload.status, payload.errorMessage);
      setCurrentSpeaker(null);
      setBanner(payload.errorMessage);
      pushToast({
        title: 'Run thất bại',
        description: payload.errorMessage,
        tone: 'danger',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.messages(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, payload.runId) }),
      ]);
    };

    const onCancelled = async (event: MessageEvent<string>) => {
      const payload = parseEvent<RunEventMap['run.cancelled']>(event);
      setRunStatus(payload.status, payload.stopReason);
      setCurrentSpeaker(null);
      setBanner(`Run đã dừng: ${payload.stopReason}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.messages(topicId) }),
        queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, payload.runId) }),
      ]);
    };

    eventSource.addEventListener('connected', asEventListener(onConnected));
    eventSource.addEventListener('run.queued', asEventListener(onQueued));
    eventSource.addEventListener('run.started', asEventListener(onStarted));
    eventSource.addEventListener('agent.started', asEventListener(onAgentStarted));
    eventSource.addEventListener('agent.delta', asEventListener(onAgentDelta));
    eventSource.addEventListener('agent.completed', asEventListener(onAgentCompleted));
    eventSource.addEventListener('run.waiting_human', asEventListener(onWaitingHuman));
    eventSource.addEventListener('run.completed', asEventListener(onCompleted));
    eventSource.addEventListener('run.failed', asEventListener(onFailed));
    eventSource.addEventListener('run.cancelled', asEventListener(onCancelled));

    eventSource.onerror = () => {
      setConnectionStatus('reconnecting');
    };

    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    return () => {
      eventSource.close();
      setConnectionStatus('idle');
    };
  }, [
    appendDelta,
    completeMessage,
    ensureStreamingMessage,
    pushToast,
    queryClient,
    setActiveRun,
    setBanner,
    setConnectionStatus,
    setCurrentSpeaker,
    setRunStatus,
    setWaitingHuman,
    topicId,
  ]);
}
