import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * login calls Supabase to authenticate the user and fetch their profile.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await this.databaseService.client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Let's log the actual error message from Supabase so you can debug it (e.g. "Email not confirmed")
      console.error('Supabase Auth Error:', authError?.message);
      throw new UnauthorizedException(authError?.message || 'Invalid email or password');
    }

    const userId = authData.user.id;

    // 2. Fetch the user's role and account_status from the profiles table
    const { data: profile, error: profileError } = await this.databaseService.client
      .from('profiles')
      .select('role, account_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Profile not found.');
    }

    // 3. Check if the account is active
    if (profile.account_status !== 'active') {
      throw new ForbiddenException('Account is inactive.');
    }

    // 4. Return the session token and role back to the frontend
    return {
      access_token: authData.session.access_token,
      role: profile.role,
    };
  }

  /**
   * logout invalidates the Supabase session
   */
  async logout() {
    const { error } = await this.databaseService.client.auth.signOut();
    if (error) {
      throw new UnauthorizedException('Failed to logout');
    }
    return { message: 'Logout successful' };
  }
}
