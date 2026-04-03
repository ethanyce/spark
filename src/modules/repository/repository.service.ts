import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class RepositoryService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * searchDocuments returns approved documents whose title contains
   * the search query (case-insensitive).
   */
  async searchDocuments(name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Search query cannot be empty.');
    }

    const { data, error } = await this.databaseService.client
      .from('documents')
      .select(
        'id, title, authors, abstract, year, department, type, track_specialization, adviser, keywords, pdf_file_path, uploaded_by, created_at',
      )
      .eq('status', 'approved')
      .ilike('title', `%${name.trim()}%`);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
