import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from '../student/dto/upload-material.dto';
import { ReviseDocumentDto } from './dto/revise-document.dto';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ─── Static sub-routes first (must precede :id routes) ───────────────────

  /**
   * GET /api/documents/search?q=
   * Public. Full-text search across title, authors, abstract, and keywords.
   * Relevance-ranked results for approved documents only.
   */
  @Get('search')
  searchDocuments(@Query('q') q: string) {
    return this.documentsService.searchDocuments(q);
  }

  /**
   * GET /api/documents/check-duplicate?title=
   * Public (called during upload). Returns existing titles with similarity ≥ 80%.
   */
  @Get('check-duplicate')
  checkDuplicate(@Query('title') title: string) {
    return this.documentsService.checkDuplicate(title);
  }

  // ─── Collection routes ────────────────────────────────────────────────────

  /**
   * POST /api/documents/upload
   * Student-only. Multipart/form-data: PDF file + metadata JSON fields.
   * Auto-sets status='pending'.
   */
  @Post('upload')
  @UseGuards(SupabaseGuard, RolesGuard)
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
    @Body() dto: UploadDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.uploadDocument(req.user.id, file, dto);
  }

  /**
   * GET /api/documents
   * Public. Paginated list of approved documents with optional filters:
   * department, type (thesis|capstone), year, track, keyword.
   */
  @Get()
  listDocuments(@Query() dto: ListDocumentsDto) {
    return this.documentsService.listDocuments(dto);
  }

  // ─── Item routes ─────────────────────────────────────────────────────────

  /**
   * PUT /api/documents/:id
   * Student-only. Re-upload a revised PDF and/or update metadata.
   * Only permitted when document status='revision'. Resets status to 'pending'.
   */
  @Put(':id')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('student')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  reviseDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ReviseDocumentDto,
    @Request() req: any,
  ) {
    return this.documentsService.reviseDocument(id, req.user.id, file, dto);
  }

  /**
   * GET /api/documents/:id/download-abstract
   * Public. Returns the document abstract as a plain-text file download.
   */
  @Get(':id/download-abstract')
  async downloadAbstract(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.getAbstractContent(id);

    const authorsText = Array.isArray(doc.authors) ? doc.authors.join(', ') : doc.authors;
    const content = [
      `Title:      ${doc.title}`,
      `Authors:    ${authorsText}`,
      `Year:       ${doc.year ?? 'N/A'}`,
      `Department: ${doc.department}`,
      `Type:       ${doc.type}`,
      `Adviser:    ${doc.adviser ?? 'N/A'}`,
      '',
      'Abstract:',
      doc.abstract ?? 'No abstract available.',
    ].join('\n');

    const safeTitle = doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-abstract.txt"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  }
}
