import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
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
   *  2. Creates their profile row with role='admin' and account_status='inactive'.
   *  3. The same on_email_confirmed trigger flips account_status to 'active' once they
   *     accept the invite and confirm their email.
   */
  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email } = createAdminDto;

    // Guard against duplicate profiles
    const { data: existing } = await this.databaseService.client
      .from('profiles')
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

    // Create the profile row; account_status='inactive' until they complete the invite
    const { data: profile, error: profileError } = await this.databaseService.client
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        email,
        role: 'admin',
        account_status: 'inactive',
      })
      .select('id, email, role, account_status')
      .single();

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned auth record
      await this.databaseService.client.auth.admin.deleteUser(inviteData.user.id);
      throw new InternalServerErrorException('Failed to create admin profile.');
    }

    return {
      message: 'Admin account created. An invitation email has been sent.',
      admin: profile,
    };
  }
}
