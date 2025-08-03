import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class BodyPasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const password = request.body?.password;
    const expected = process.env.API_PASSWORD || 'supersecret';

    if (!password || password !== expected) {
      throw new UnauthorizedException('Invalid or missing password in body');
    }

    return true;
  }
}
