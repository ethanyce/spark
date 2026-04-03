import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * SupabaseGuard protects routes by validating the Supabase JWT.
 * On success it attaches a `req.user` object with fields drawn
 * from the `users` table: id, email, role, department, first_name,
 * last_name, and is_active.
 */
@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT with Supabase Auth
    const {
      data: { user },
      error,
    } = await this.databaseService.client.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Fetch the user's profile from the `users` table
    const { data: userRecord, error: userError } = await this.databaseService.client
      .from('users')
      .select('role, is_active, department, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord) {
      throw new UnauthorizedException('User record not found.');
    }

    if (!userRecord.is_active) {
      throw new UnauthorizedException('Account is inactive.');
    }

    // Attach the merged user info to the Express request object
    request.user = {
      id: user.id,
      email: user.email,
      role: userRecord.role,
      department: userRecord.department,
      first_name: userRecord.first_name,
      last_name: userRecord.last_name,
      is_active: userRecord.is_active,
    };

    return true;
  }
}
