import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/decorator/roles.decorator';
import { UserRole } from '@/modules/users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      const requiredRolesStr = requiredRoles.join(', ');
      throw new ForbiddenException(
        `Bạn không có quyền truy cập. Yêu cầu quyền: ${requiredRolesStr}, Quyền hiện tại: ${user.role}`,
      );
    }

    return true;
  }
}
