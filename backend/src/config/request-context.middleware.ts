import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';

import { AppConfigService } from 'src/config/app-config.service';
import { RequestWithContext } from 'src/common/interfaces/request-context.interface';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly appConfig: AppConfigService) {}

  use(request: RequestWithContext, response: Response, next: NextFunction) {
    const requestId = String(request.headers['x-request-id'] ?? randomUUID());
    const headerUserId = request.headers['x-user-id'];
    const queryUserId =
      typeof request.query.userId === 'string' && request.query.userId.trim().length > 0
        ? request.query.userId
        : undefined;
    const userId = (
      typeof headerUserId === 'string' && headerUserId.trim().length > 0
        ? headerUserId
        : queryUserId ?? this.appConfig.defaultUserId
    ) as string;

    request.requestContext = {
      requestId,
      userId,
    };

    response.setHeader('x-request-id', requestId);
    response.setHeader('x-user-id', userId);

    next();
  }
}
