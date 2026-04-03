import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Injectable()
export class AdminService {
  constructor(private databaseService: DatabaseService) {}

  // ─── M-01: User Provisioning ───────────────────────────────────────────────

  /**
   * createStudent provisions a new student account.
   *
   * Flow:
   *  1. Sends a Supabase invite email so the student can set their own password.
   *  2. Inserts a row into `users` with role='student' and is_active=false.
   *  3. A Supabase database trigger flips is_active=true once they confirm email.
   */
  async createStudent(dto: CreateStudentDto) {
    const { email, first_name, last_name, department } = dto;

    // Guard against duplicate users
    const { data: existing } = await this.databaseService.client
      .from('users')
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

    const { data: user, error: userError } = await this.databaseService.client
      .from('users')
      .insert({
        id: inviteData.user.id,
        email,
        first_name,
        last_name,
        role: 'student',
        department,
        is_active: false,
      })
      .select('id, email, first_name, last_name, role, department, is_active, created_at')
      .single();

    if (userError) {
      // Roll back the auth user so we don't leave an orphaned auth record
      await this.databaseService.client.auth.admin.deleteUser(inviteData.user.id);
      throw new InternalServerErrorException('Failed to create student record.');
    }

    return {
      message: 'Student account created. An invitation email has been sent.',
      student: user,
    };
  }

  // ─── M-04: Submission Review ───────────────────────────────────────────────

  /**
   * getSubmissions returns pending/all submissions scoped by department.
   * Admins only see documents from their own department.
   * super_admin sees everything.
   */
  async getSubmissions(currentUser: any, status?: string) {
    let query = this.databaseService.client
      .from('documents')
      .select(
        'id, title, authors, abstract, year, department, type, track_specialization, adviser, keywords, pdf_file_path, uploaded_by, status, created_at, updated_at',
      )
      .order('created_at', { ascending: false });

    // Department scoping: admins see only their department
    if (currentUser.role === 'admin') {
      query = query.eq('department', currentUser.department);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * reviewSubmission records a review decision (approve | reject | revise),
   * updates the document status, and fires a notification to the student.
   */
  async reviewSubmission(documentId: string, currentUser: any, dto: ReviewSubmissionDto) {
    // Fetch the target document
    const { data: document, error: fetchError } = await this.databaseService.client
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      throw new NotFoundException('Document not found.');
    }

    // Admins may only review documents belonging to their department
    if (currentUser.role === 'admin' && document.department !== currentUser.department) {
      throw new ForbiddenException('You can only review documents from your department.');
    }

    // Map decision → new status
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      revise: 'revision',
    };
    const newStatus = statusMap[dto.decision];

    // Persist the review record
    const { error: reviewError } = await this.databaseService.client.from('reviews').insert({
      document_id: documentId,
      reviewed_by: currentUser.id,
      decision: dto.decision,
      feedback_text: dto.feedback ?? null,
    });

    if (reviewError) {
      throw new InternalServerErrorException('Failed to save review record.');
    }

    // Update document status
    const { data: updated, error: updateError } = await this.databaseService.client
      .from('documents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new InternalServerErrorException('Failed to update document status.');
    }

    // Notify the submitting student
    const notificationMessage = dto.feedback
      ? `Your document "${document.title}" was ${dto.decision}d. Feedback: ${dto.feedback}`
      : `Your document "${document.title}" was ${dto.decision}d.`;

    await this.databaseService.client.from('notifications').insert({
      user_id: document.uploaded_by,
      type: `document_${dto.decision}d`,
      message: notificationMessage,
      is_read: false,
      reference_id: documentId,
    });

    return {
      message: `Document ${dto.decision}d successfully.`,
      document: updated,
    };
  }

  // ─── M-04: Full-Text Request Handling ─────────────────────────────────────

  /**
   * getFulltextRequests returns all full-text requests.
   * Admins see requests for documents in their department; super_admin sees all.
   */
  async getFulltextRequests(currentUser: any, status?: string) {
    let query = this.databaseService.client
      .from('fulltext_requests')
      .select(
        'id, document_id, requester_name, requester_email, purpose, department, status, handled_by, created_at, fulfilled_at',
      )
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * updateFulltextRequest marks a full-text request as fulfilled or denied.
   */
  async updateFulltextRequest(
    requestId: string,
    currentUser: any,
    status: 'fulfilled' | 'denied',
  ) {
    const { data: request, error: fetchError } = await this.databaseService.client
      .from('fulltext_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new NotFoundException('Full-text request not found.');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException('This request has already been processed.');
    }

    const { data: updated, error: updateError } = await this.databaseService.client
      .from('fulltext_requests')
      .update({
        status,
        handled_by: currentUser.id,
        fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw new InternalServerErrorException('Failed to update request status.');
    }

    return {
      message: `Full-text request marked as ${status}.`,
      request: updated,
    };
  }
}
