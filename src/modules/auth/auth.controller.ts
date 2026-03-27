import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SupabaseGuard } from './supabase.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Public route to authenticate a user. Returns session token + role.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/logout
   * Protected route. Calls Supabase signOut.
   */
  @UseGuards(SupabaseGuard)
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  /**
   * GET /auth/profile
   * Protected route. Returns the logged-in user's profile from profiles table.
   * The SupabaseGuard automatically attaches `req.user` (which includes the profile data).
   */
  @UseGuards(SupabaseGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
