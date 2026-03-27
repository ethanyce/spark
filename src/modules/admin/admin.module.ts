import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService, SupabaseGuard, RolesGuard],
  controllers: [AdminController],
})
export class AdminModule {}
