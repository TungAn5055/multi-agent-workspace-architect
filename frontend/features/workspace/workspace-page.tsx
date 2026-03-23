'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SiteShell } from '@/components/layout/site-shell';
import { Composer } from '@/components/workspace/composer';
import { MessageTimeline } from '@/components/workspace/message-timeline';
import { RunStatusBar } from '@/components/workspace/run-status-bar';
import { TopicSidebar } from '@/components/workspace/topic-sidebar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage, topicKeys, useArchiveTopicMutation, useTopicDetailQuery } from '@/features/topics/topic-queries';
import {
  useCancelRunMutation,
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
  const cancelRunMutation = useCancelRunMutation(topicId, activeRunId);
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
      subtitle="Workspace hiển thị đầy đủ timeline nhiều agent, trạng thái run và sidebar cấu hình đội agent của topic hiện tại."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-4">
          <RunStatusBar
            status={activeRun?.status ?? topicQuery.data.activeRun?.status ?? null}
            currentSpeaker={currentSpeaker}
            banner={
              banner ??
              (connectionStatus === 'reconnecting'
                ? 'SSE đang reconnect... timeline sẽ bắt nhịp lại khi kết nối phục hồi.'
                : null)
            }
            runDetail={runDetailQuery.data}
            onStop={async () => {
              try {
                await cancelRunMutation.mutateAsync({
                  reason: 'cancelled_by_user',
                });
              } catch (error) {
                pushToast({
                  title: 'Dừng run thất bại',
                  description: getErrorMessage(error),
                  tone: 'danger',
                });
              }
            }}
          />

          <div className="rounded-[30px] border border-line/20 bg-shell/40 p-4 sm:p-5">
            {mergedMessages.length > 0 ? (
              <MessageTimeline messages={mergedMessages} highlightedMessageId={highlightedMessageId} />
            ) : (
              <EmptyState
                className="min-h-[420px] flex items-center justify-center"
                title="Topic chưa có hội thoại"
                description="Gửi message đầu tiên để khởi động run. Hệ thống sẽ chọn subset agent phù hợp thay vì cho mọi agent nói máy móc."
              />
            )}
          </div>

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
