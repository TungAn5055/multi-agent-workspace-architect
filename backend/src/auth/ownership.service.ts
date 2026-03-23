import { Injectable } from '@nestjs/common';

import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';

@Injectable()
export class OwnershipService {
  assertOwner(resourceUserId: string, actorUserId: string) {
    if (resourceUserId !== actorUserId) {
      throw new AppException({
        status: 403,
        code: ERROR_CODES.ownershipDenied,
        message: 'Bạn không có quyền thao tác với topic này.',
      });
    }
  }
}
