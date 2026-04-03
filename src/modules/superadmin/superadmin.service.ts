import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class SuperadminService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * createAdmin provisions a new admin account.
   *
   * Flow:
   *  1. Sends a Supabase invite email so the admin can set their own password.
   *  2. Inserts a row into `users` with role='admin' and is_active=false.
   *  3. A Supabase database trigger flips is_active=true once they confirm email.
   */
  async createAdmin(dto: CreateAdminDto) {
    const { email, first_name, last_name, department } = dto;

    // Guard against duplicate users
    const { data: existing } = await this.databaseService.client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Invite the user — Supabase creates the auth user and sends a set-password link
    const { data: inviteData, error: inviteError } =
      await this.databaseService.client.auth.admin.inviteUserByEmail(email);

    if (inviteError || !inviteData.user) {
      throw new InternalServerErrorException(
        inviteError?.message || 'Failed to send admin invitation.',
      );
    }

    const { data: user, error: userError } = await this.databaseService.client
      .from('users')
      .insert({
        id: inviteData.user.id,
        email,
        first_name,
        last_name,
        role: 'admin',
        department,
        is_active: false,
      })
      .select('id, email, first_name, last_name, role, department, is_active, created_at')
      .single();

    if (userError) {
      // Roll back the auth user so we don't leave an orphaned auth record
      await this.databaseService.client.auth.admin.deleteUser(inviteData.user.id);
      throw new InternalServerErrorException('Failed to create admin record.');
    }

    return {
      message: 'Admin account created. An invitation email has been sent.',
      admin: user,
    };
  }
}
