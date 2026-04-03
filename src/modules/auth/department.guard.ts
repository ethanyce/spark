import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * DepartmentGuard enforces department-scoped access on routes decorated
 * with @Departments(...).
 *
 * super_admin always passes regardless of department.
 * Admins are restricted to their own department.
 *
 * Must be used AFTER SupabaseGuard (req.user must already be populated).
 */
@Injectable()
export class DepartmentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const departments = this.reflector.get<string[]>(
      'departments',
      context.getHandler(),
    );

    // No department restriction on this route
    if (!departments || departments.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // super_admin bypasses all department restrictions
    if (user?.role === 'super_admin') return true;

    if (!user || !departments.includes(user.department)) {
      throw new ForbiddenException(
        'Access restricted: you do not belong to a permitted department.',
      );
    }

    return true;
  }
}
