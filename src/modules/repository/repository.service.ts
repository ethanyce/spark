import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class RepositoryService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * searchMaterials returns approved materials whose file_name contains
   * the search query (case-insensitive). The query does not need to be
   * the full name of the material.
   */
  async searchMaterials(name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Search query cannot be empty.');
    }

    const { data, error } = await this.databaseService.client
      .from('materials')
      .select('id, file_name, author, publish_date, version, file_path, submitted_by, created_at')
      .eq('status', 'approved')
      .ilike('file_name', `%${name.trim()}%`);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
