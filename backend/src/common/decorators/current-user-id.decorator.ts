import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithContext } from 'src/common/interfaces/request-context.interface';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.requestContext.userId;
  },
);
