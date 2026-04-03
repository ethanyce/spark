import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SupabaseGuard } from './supabase.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Public. Authenticates a user and returns a session token, role, and department.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/logout
   * Protected. Invalidates the current Supabase session.
   */
  @UseGuards(SupabaseGuard)
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  /**
   * GET /api/auth/me
   * Protected. Returns the currently authenticated user's profile
   * as populated by SupabaseGuard from the `users` table.
   */
  @UseGuards(SupabaseGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return req.user;
  }
}
