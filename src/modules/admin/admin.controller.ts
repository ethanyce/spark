import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(SupabaseGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * POST /admin/students
   * Admin-only. Creates a student account and sends them an invite email
   * so they can set their password. The account is inactive until they do.
   */
  @Post('students')
  @Roles('admin')
  createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.adminService.createStudent(createStudentDto);
  }
}
