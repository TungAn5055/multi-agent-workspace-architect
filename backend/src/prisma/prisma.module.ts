import { Global, Module } from '@nestjs/common';

import { PhaseTwoSchemaService } from 'src/prisma/phase-two-schema.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Global()
@Module({
  providers: [PrismaService, PhaseTwoSchemaService],
  exports: [PrismaService, PhaseTwoSchemaService],
})
export class PrismaModule {}
