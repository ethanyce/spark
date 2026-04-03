import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { UpdateFulltextRequestDto } from './dto/update-fulltext-request.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(SupabaseGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── M-01: User Provisioning ───────────────────────────────────────────────

  /**
   * POST /api/admin/students
   * Admin or super_admin only. Creates a student account and sends an invite email.
   */
  @Post('students')
  @Roles('admin', 'super_admin')
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.adminService.createStudent(createStudentDto);
  }

  // ─── M-04: Submission Review ───────────────────────────────────────────────

  /**
   * GET /api/admin/submissions?status=pending
   * Admin or super_admin only.
   * Admins see only their department's submissions; super_admin sees all.
   */
  @Get('submissions')
  @Roles('admin', 'super_admin')
  getSubmissions(@Request() req: any, @Query('status') status?: string) {
    return this.adminService.getSubmissions(req.user, status);
  }

  /**
   * POST /api/admin/submissions/:id/review
   * Admin or super_admin only. Approve, reject, or request revision on a submission.
   * Body: { decision: 'approve' | 'reject' | 'revise', feedback?: string }
   */
  @Post('submissions/:id/review')
  @Roles('admin', 'super_admin')
  reviewSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Request() req: any,
  ) {
    return this.adminService.reviewSubmission(id, req.user, dto);
  }

  // ─── M-04: Full-Text Request Handling ─────────────────────────────────────

  /**
   * GET /api/admin/fulltext-requests?status=pending
   * Admin or super_admin only. Lists all full-text requests.
   */
  @Get('fulltext-requests')
  @Roles('admin', 'super_admin')
  getFulltextRequests(@Request() req: any, @Query('status') status?: string) {
    return this.adminService.getFulltextRequests(req.user, status);
  }

  /**
   * PUT /api/admin/fulltext-requests/:id
   * Admin or super_admin only. Mark a request as fulfilled (email PDF) or denied.
   * Body: { status: 'fulfilled' | 'denied' }
   */
  @Put('fulltext-requests/:id')
  @Roles('admin', 'super_admin')
  updateFulltextRequest(
    @Param('id') id: string,
    @Body() dto: UpdateFulltextRequestDto,
    @Request() req: any,
  ) {
    return this.adminService.updateFulltextRequest(id, req.user, dto.status);
  }
}
