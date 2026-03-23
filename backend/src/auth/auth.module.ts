import { Module } from '@nestjs/common';

import { OwnershipService } from 'src/auth/ownership.service';

@Module({
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class AuthModule {}
