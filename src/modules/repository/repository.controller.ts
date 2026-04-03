import { Controller, Get, Query } from '@nestjs/common';
import { RepositoryService } from './repository.service';

@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  /**
   * GET /api/repository/documents?name=...
   * Public. Returns approved documents whose title contains the search query.
   */
  @Get('documents')
  searchDocuments(@Query('name') name: string) {
    return this.repositoryService.searchDocuments(name);
  }
}
