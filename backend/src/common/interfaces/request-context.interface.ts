import { Request } from 'express';

export interface RequestContext {
  requestId: string;
  userId: string;
}

export interface RequestWithContext extends Request {
  requestContext: RequestContext;
}
