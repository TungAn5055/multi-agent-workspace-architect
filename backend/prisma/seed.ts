import { AgentRole, PrismaClient, TopicStatus } from '@prisma/client';

const prisma = new PrismaClient();

const demoUserId = process.env.APP_DEFAULT_USER_ID ?? 'demo-user';
const defaultModel =
  process.env.LLM_MODEL ??
  process.env.NVIDIA_MODEL ??
  process.env.OPENAI_MODEL ??
  'nvidia/nemotron-3-super-120b-a12b';

async function main() {
  await prisma.runStep.deleteMany();
  await prisma.run.deleteMany();
  await prisma.message.deleteMany();
  await prisma.topicAgent.deleteMany();
  await prisma.topic.deleteMany();

  await prisma.topic.create({
    data: {
      userId: demoUserId,
      title: 'Lập kế hoạch MVP workspace đa agent',
      status: TopicStatus.DRAFT,
      sharedModel: defaultModel,
      agents: {
        create: [
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
      },
    },
  });

  await prisma.topic.create({
    data: {
      userId: demoUserId,
      title: 'Topic đã archive để QA',
      status: TopicStatus.ARCHIVED,
      sharedModel: defaultModel,
      agents: {
        create: [
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
      },
    },
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
