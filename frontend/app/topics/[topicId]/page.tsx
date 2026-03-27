import { WorkspacePage } from '@/features/workspace/workspace-page';

export default async function TopicWorkspacePage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <WorkspacePage topicId={topicId} />;
}
