import { Module } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [DatabaseModule],
  providers: [SuperadminService, SupabaseGuard, RolesGuard],
  controllers: [SuperadminController],
})
export class SuperadminModule {}
