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
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { UploadDocumentDto } from './dto/upload-material.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('student')
@UseGuards(SupabaseGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * POST /api/student/documents
   * Student-only. Accepts multipart/form-data with a PDF file and
   * document metadata. Status is automatically set to 'pending'.
   */
  @Post('documents')
  @Roles('student')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @Request() req: any,
  ) {
    return this.studentService.uploadDocument(req.user.id, file, uploadDocumentDto);
  }
}
