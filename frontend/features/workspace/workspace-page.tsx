'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SiteShell } from '@/components/layout/site-shell';
import { Composer } from '@/components/workspace/composer';
import { MessageTimeline } from '@/components/workspace/message-timeline';
import { TopicSidebar } from '@/components/workspace/topic-sidebar';
import { RunStatusBadge } from '@/components/ui/run-status-badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage, topicKeys, useArchiveTopicMutation, useTopicDetailQuery } from '@/features/topics/topic-queries';
import {
  usePostHumanMessageMutation,
  useRunDetailQuery,
  useTopicMessagesQuery,
} from '@/features/workspace/workspace-queries';
import { useTopicStream } from '@/hooks/use-topic-stream';
import { useToastStore } from '@/stores/toast-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function WorkspacePage({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.push);
  const topicQuery = useTopicDetailQuery(topicId);
  const messagesQuery = useTopicMessagesQuery(topicId);
  const resetWorkspace = useWorkspaceStore((state) => state.reset);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrate);
  const upsertMessage = useWorkspaceStore((state) => state.upsertMessage);
  const activeRun = useWorkspaceStore((state) => state.activeRun);
  const currentSpeaker = useWorkspaceStore((state) => state.currentSpeaker);
  const highlightedMessageId = useWorkspaceStore((state) => state.highlightedMessageId);
  const waitingHuman = useWorkspaceStore((state) => state.waitingHuman);
  const connectionStatus = useWorkspaceStore((state) => state.connectionStatus);
  const banner = useWorkspaceStore((state) => state.banner);
  const setActiveRun = useWorkspaceStore((state) => state.setActiveRun);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const [chatViewportHeight, setChatViewportHeight] = useState<number | null>(null);

  useTopicStream(topicId);

  useEffect(() => {
    resetWorkspace(topicId);
  }, [resetWorkspace, topicId]);

  useEffect(() => {
    if (!topicQuery.data || !messagesQuery.data) {
      return;
    }

    hydrateWorkspace(topicId, messagesQuery.data.items, topicQuery.data.activeRun);
  }, [hydrateWorkspace, messagesQuery.data, topicId, topicQuery.data]);

  const activeRunId = activeRun?.id ?? topicQuery.data?.activeRun?.id ?? null;
  const runDetailQuery = useRunDetailQuery(topicId, activeRunId);

  useEffect(() => {
    if (!runDetailQuery.data) {
      return;
    }

    setActiveRun({
      id: runDetailQuery.data.id,
      status: runDetailQuery.data.status,
      stopReason: runDetailQuery.data.stopReason,
    });
  }, [runDetailQuery.data, setActiveRun]);

  const postMessageMutation = usePostHumanMessageMutation(topicId);
  const archiveTopicMutation = useArchiveTopicMutation(topicId);

  const mergedMessages = useWorkspaceStore((state) => state.messages);

  const canSend = useMemo(() => {
    if (!topicQuery.data) {
      return false;
    }

    if (topicQuery.data.status === 'archived') {
      return false;
    }

    if (!activeRun) {
      return true;
    }

    return ['waiting_human', 'completed', 'failed', 'cancelled'].includes(activeRun.status);
  }, [activeRun, topicQuery.data]);

  const chatBanner =
    banner ??
    (connectionStatus === 'reconnecting'
      ? 'SSE đang reconnect. Timeline sẽ bắt nhịp lại khi kết nối phục hồi.'
      : currentSpeaker
        ? `${currentSpeaker.agentName} đang phản hồi trong cuộc thảo luận.`
        : activeRun?.status === 'waiting_human'
          ? 'Cuộc thảo luận đang chờ bạn trả lời để tiếp tục.'
          : mergedMessages.length > 0
            ? 'Theo dõi timeline ở giữa và nhập phản hồi ở khung cố định bên dưới.'
            : 'Gửi message đầu tiên để khởi động cuộc thảo luận đa agent.');

  useEffect(() => {
    let frameId = 0;

    const updateChatViewportHeight = () => {
      const element = chatViewportRef.current;
      if (!element) {
        return;
      }

      const top = element.getBoundingClientRect().top;
      const nextHeight = Math.max(window.innerHeight - top, 320);
      setChatViewportHeight(nextHeight);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateChatViewportHeight);
    };

    scheduleUpdate();

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, [chatBanner]);

  if (topicQuery.isLoading || messagesQuery.isLoading) {
    return (
      <SiteShell title="Đang tải workspace" subtitle="Hệ thống đang đồng bộ topic detail và timeline từ backend.">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-10 w-10" />
        </div>
      </SiteShell>
    );
  }

  if (topicQuery.isError || !topicQuery.data) {
    return (
      <SiteShell title="Workspace lỗi" subtitle="Không thể tải topic detail hoặc bạn không có quyền xem topic này.">
        <EmptyState
          title="Không mở được workspace"
          description={getErrorMessage(topicQuery.error)}
          action={
            <div className="flex justify-center gap-3">
              <Button onClick={() => topicQuery.refetch()}>Thử lại</Button>
              <Button variant="ghost" href="/topics">
                Quay về danh sách topic
              </Button>
            </div>
          }
        />
      </SiteShell>
    );
  }

  return (
    <SiteShell
      title={topicQuery.data.title}
      subtitle=""
    >
      <div className="grid min-h-0 gap-6 xl:flex-1 xl:grid-cols-[minmax(0,1.7fr)_360px] xl:items-start">
        <div className="flex min-h-0 flex-col xl:min-h-0">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-line/20 bg-[#2f2f2d] shadow-panel xl:h-full">

            <div
              ref={chatViewportRef}
              className="flex min-h-0 flex-col overflow-hidden bg-[#2c2c2a] px-4 py-5 sm:px-6"
              style={chatViewportHeight ? { height: `${chatViewportHeight}px` } : undefined}
            >
              <div className="min-h-0 flex-1">
                {mergedMessages.length > 0 ? (
                  <MessageTimeline messages={mergedMessages} highlightedMessageId={highlightedMessageId} />
                ) : (
                  <EmptyState
                    className="flex h-full min-h-[320px] items-center justify-center border-dashed bg-white/[0.02]"
                    title="Topic chưa có hội thoại"
                    description="Gửi message đầu tiên để khởi động run. Hệ thống sẽ chọn subset agent phù hợp thay vì cho mọi agent nói máy móc."
                  />
                )}
              </div>

              <div className="mt-4 shrink-0">
                <Composer
                  archived={topicQuery.data.status === 'archived'}
                  disabled={!canSend || postMessageMutation.isPending}
                  waitingHuman={waitingHuman || activeRun?.status === 'waiting_human'}
                  onSend={async (content) => {
                    try {
                      const result = await postMessageMutation.mutateAsync({
                        contentMarkdown: content,
                        clientRequestId: crypto.randomUUID(),
                      });
                      upsertMessage(result.message);
                      setActiveRun({
                        id: result.run.id,
                        status: result.run.status,
                      });
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: topicKeys.detail(topicId) }),
                        queryClient.invalidateQueries({ queryKey: topicKeys.messages(topicId) }),
                        queryClient.invalidateQueries({ queryKey: topicKeys.run(topicId, result.run.id) }),
                      ]);
                    } catch (error) {
                      pushToast({
                        title: 'Gửi message thất bại',
                        description: getErrorMessage(error),
                        tone: 'danger',
                      });
                    }
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        <TopicSidebar
          topic={topicQuery.data}
          messageCount={mergedMessages.length}
          onArchive={async () => {
            try {
              await archiveTopicMutation.mutateAsync();
              pushToast({
                title: 'Topic đã được archive',
                description: 'Workspace này sẽ không nhận run mới theo policy backend hiện tại.',
                tone: 'success',
              });
            } catch (error) {
              pushToast({
                title: 'Archive thất bại',
                description: getErrorMessage(error),
                tone: 'danger',
              });
            }
          }}
        />
      </div>
    </SiteShell>
  );
}
