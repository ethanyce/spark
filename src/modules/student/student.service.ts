import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UploadMaterialDto } from './dto/upload-material.dto';

@Injectable()
export class StudentService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * uploadMaterial stores the file in Supabase Storage then inserts a record
   * into the materials table. The status defaults to 'pending' in the database.
   * The author is automatically set to the submitting student's name.
   */
  async uploadMaterial(
    userId: string,
    file: Express.Multer.File,
    dto: UploadMaterialDto,
  ) {
    // Fetch the student's name to use as the author
    const { data: profile, error: profileError } = await this.databaseService.client
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new InternalServerErrorException('Failed to fetch student profile.');
    }

    // Store under {userId}/{timestamp}_{originalname} to avoid collisions
    const storagePath = `${userId}/${Date.now()}_${file.originalname}`;

    const { error: storageError } = await this.databaseService.client.storage
      .from('materials')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });

    if (storageError) {
      throw new InternalServerErrorException(
        storageError.message || 'Failed to upload file to storage.',
      );
    }

    const { data: material, error: dbError } = await this.databaseService.client
      .from('materials')
      .insert({
        author: profile.name,
        publish_date: dto.publish_date ?? null,
        version: dto.version ?? null,
        file_path: storagePath,
        file_name: file.originalname,
        submitted_by: userId,
      })
      .select()
      .single();

    if (dbError) {
      // Roll back the storage upload so we don't leave orphaned files
      await this.databaseService.client.storage
        .from('materials')
        .remove([storagePath]);
      throw new InternalServerErrorException('Failed to save material record.');
    }

    return material;
  }
}
