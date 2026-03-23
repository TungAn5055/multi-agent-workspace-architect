import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

export type DbClient = Prisma.TransactionClient | PrismaService;
