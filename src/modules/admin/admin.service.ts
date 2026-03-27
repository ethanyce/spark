import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class AdminService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * createStudent provisions a new student account.
   *
   * Flow:
   *  1. Sends a Supabase invite email so the student can set their own password.
   *  2. Creates their profile row with role='student' and account_status='inactive'.
   *  3. The account_status flips to 'active' once they complete the invite and set their password
   *     (handled via a Supabase database trigger on email confirmation).
   */
  async createStudent(createStudentDto: CreateStudentDto) {
    const { email } = createStudentDto;

    // Guard against duplicate profiles
    const { data: existing } = await this.databaseService.client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      throw new ConflictException('A student with this email already exists.');
    }

    // Invite the user — Supabase creates the auth user and sends a set-password link
    const { data: inviteData, error: inviteError } =
      await this.databaseService.client.auth.admin.inviteUserByEmail(email);

    if (inviteError || !inviteData.user) {
      throw new InternalServerErrorException(
        inviteError?.message || 'Failed to send student invitation.',
      );
    }

    // Create the profile row; account_status='inactive' until they complete the invite
    const { data: profile, error: profileError } = await this.databaseService.client
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        email,
        role: 'student',
        account_status: 'inactive',
      })
      .select('id, email, role, account_status')
      .single();

    if (profileError) {
      // Roll back the auth user so we don't leave an orphaned auth record
      await this.databaseService.client.auth.admin.deleteUser(inviteData.user.id);
      throw new InternalServerErrorException('Failed to create student profile.');
    }

    return {
      message: 'Student account created. An invitation email has been sent.',
      student: profile,
    };
  }
}
