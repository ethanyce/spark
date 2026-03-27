import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('superadmin')
@UseGuards(SupabaseGuard, RolesGuard)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  /**
   * POST /superadmin/admins
   * Superadmin-only. Creates an admin account and sends them an invite email
   * so they can set their password. The account is inactive until they do.
   */
  @Post('admins')
  @Roles('superadmin')
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.superadminService.createAdmin(createAdminDto);
  }
}
