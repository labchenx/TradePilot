import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser, RequestWithUser } from './auth.types';

export const CurrentUserParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user as CurrentUser;
  },
);
