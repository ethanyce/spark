import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * SupabaseGuard protects routes by validating the Supabase JWT.
 * It verifies the token securely with Supabase and fetches the user's profile.
 */
@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    // Extract the JWT token
    const token = authHeader.split(' ')[1];

    // Ask Supabase to verify the token and return the underlying Auth user
    const { data: { user }, error } = await this.databaseService.client.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Fetch the attached custom profile data (role, is_active) from the 'profiles' table
    const { data: profile, error: profileError } = await this.databaseService.client
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Profile not found for this user.');
    }

    // We can enforce is_active checks directly on protected routes too
    if (!profile.is_active) {
      throw new UnauthorizedException('Account is inactive.');
    }

    // Attach the merged user info to the Express request object
    request.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      is_active: profile.is_active,
    };

    return true; // The user is allowed to access the route
  }
}
