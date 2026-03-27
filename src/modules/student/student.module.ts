import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [DatabaseModule],
  providers: [StudentService, SupabaseGuard, RolesGuard],
  controllers: [StudentController],
})
export class StudentModule {}
