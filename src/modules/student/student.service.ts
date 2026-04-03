import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UploadDocumentDto } from './dto/upload-material.dto';

@Injectable()
export class StudentService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * uploadDocument stores the PDF in Supabase Storage under the `documents`
   * bucket, then inserts a record into the `documents` table.
   * Status defaults to 'pending' and is set by the database.
   */
  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ) {
    // Store under documents/{userId}/{timestamp}_{originalname}
    const storagePath = `${userId}/${Date.now()}_${file.originalname}`;

    const { error: storageError } = await this.databaseService.client.storage
      .from('documents')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });

    if (storageError) {
      throw new InternalServerErrorException(
        storageError.message || 'Failed to upload file to storage.',
      );
    }

    const { data: document, error: dbError } = await this.databaseService.client
      .from('documents')
      .insert({
        title: dto.title,
        authors: dto.authors,
        abstract: dto.abstract ?? null,
        year: dto.year ?? null,
        department: dto.department,
        type: dto.type,
        track_specialization: dto.track_specialization ?? null,
        adviser: dto.adviser ?? null,
        keywords: dto.keywords ?? null,
        pdf_file_path: storagePath,
        uploaded_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      // Roll back the storage upload so we don't leave orphaned files
      await this.databaseService.client.storage.from('documents').remove([storagePath]);
      throw new InternalServerErrorException('Failed to save document record.');
    }

    return document;
  }
}
