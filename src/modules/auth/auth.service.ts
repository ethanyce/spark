import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * login authenticates the user against Supabase Auth,
   * then fetches their record from the `users` table to verify
   * is_active status and return their role + department.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await this.databaseService.client.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      console.error('Supabase Auth Error:', authError?.message);
      throw new UnauthorizedException(authError?.message || 'Invalid email or password');
    }

    const userId = authData.user.id;

    // 2. Fetch the user's role, status, and department from the `users` table
    const { data: user, error: userError } = await this.databaseService.client
      .from('users')
      .select('role, is_active, department, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('User record not found.');
    }

    // 3. Block inactive accounts
    if (!user.is_active) {
      throw new ForbiddenException('Account is inactive. Please complete your email invitation.');
    }

    // 4. Return token + identifying claims
    return {
      access_token: authData.session.access_token,
      role: user.role,
      department: user.department,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }

  /**
   * logout invalidates the Supabase session server-side.
   */
  async logout() {
    const { error } = await this.databaseService.client.auth.signOut();
    if (error) {
      throw new UnauthorizedException('Failed to logout');
    }
    return { message: 'Logout successful' };
  }
}
