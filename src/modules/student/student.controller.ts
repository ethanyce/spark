import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { UploadMaterialDto } from './dto/upload-material.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('student')
@UseGuards(SupabaseGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * POST /student/materials
   * Student-only. Accepts multipart/form-data with a file and material metadata.
   * The material status defaults to 'pending' in the database.
   */
  @Post('materials')
  @Roles('student')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  uploadMaterial(
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })] }))
    file: Express.Multer.File,
    @Body() uploadMaterialDto: UploadMaterialDto,
    @Request() req: any,
  ) {
    return this.studentService.uploadMaterial(req.user.id, file, uploadMaterialDto);
  }
}
