import { SetMetadata } from '@nestjs/common';

/**
 * Restrict a route to users belonging to specific departments.
 * Usage: @Departments('IS', 'IT')
 *
 * Note: super_admin bypasses this check and can always access any route.
 */
export const Departments = (...departments: string[]) =>
  SetMetadata('departments', departments);
