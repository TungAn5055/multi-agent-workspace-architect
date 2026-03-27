import { AgentRole, PrismaClient, TopicStatus } from '@prisma/client';

const prisma = new PrismaClient();

const demoUserId = process.env.APP_DEFAULT_USER_ID ?? 'demo-user';
const defaultModel =
  process.env.LLM_MODEL ??
  process.env.NVIDIA_MODEL ??
  process.env.OPENAI_MODEL ??
  'nvidia/nemotron-3-super-120b-a12b';

async function createTopicWithSharedProvider(input: {
  title: string;
  status: TopicStatus;
  agents: Array<{
    name: string;
    nameNormalized: string;
    role: AgentRole;
    description: string;
    sortOrder: number;
  }>;
}) {
  const topic = await prisma.topic.create({
    data: {
      userId: demoUserId,
      title: input.title,
      status: input.status,
      sharedModel: defaultModel,
      agents: {
        create: input.agents,
      },
    },
  });

  await prisma.$executeRaw`
    UPDATE topics
    SET shared_provider = 'openrouter'::"LlmProvider"
    WHERE id = ${topic.id}::uuid
  `;
}

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM "user_llm_credentials"');
  await prisma.runStep.deleteMany();
  await prisma.run.deleteMany();
  await prisma.message.deleteMany();
  await prisma.topicAgent.deleteMany();
  await prisma.topic.deleteMany();

  await createTopicWithSharedProvider({
    title: 'Lập kế hoạch MVP workspace đa agent',
    status: TopicStatus.DRAFT,
    agents: [
      {
        name: 'Lan',
        nameNormalized: 'lan',
        role: AgentRole.LEAD,
        description: 'Tổng hợp, điều phối và chốt hướng thảo luận.',
        sortOrder: 0,
      },
      {
        name: 'Minh',
        nameNormalized: 'minh',
        role: AgentRole.RESEARCHER,
        description: 'Đào sâu rủi ro, giả định và khoảng trống cần kiểm tra.',
        sortOrder: 1,
      },
      {
        name: 'An',
        nameNormalized: 'an',
        role: AgentRole.CRITIC,
        description: 'Phản biện, soi điểm yếu và gợi ý fail-safe.',
        sortOrder: 2,
      },
    ],
  });

  await createTopicWithSharedProvider({
    title: 'Topic đã archive để QA',
    status: TopicStatus.ARCHIVED,
    agents: [
      {
        name: 'Lead QA',
        nameNormalized: 'lead qa',
        role: AgentRole.LEAD,
        description: 'Điều phối kiểm thử.',
        sortOrder: 0,
      },
      {
        name: 'Reviewer',
        nameNormalized: 'reviewer',
        role: AgentRole.ASSISTANT,
        description: 'Đọc lại checklist và note lỗi.',
        sortOrder: 1,
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
