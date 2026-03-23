import { WorkspacePage } from '@/features/workspace/workspace-page';

export default function TopicWorkspacePage({
  params,
}: {
  params: { topicId: string };
}) {
  return <WorkspacePage topicId={params.topicId} />;
}
