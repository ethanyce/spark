import { Controller, Get, Query } from '@nestjs/common';
import { RepositoryService } from './repository.service';

@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  /**
   * GET /repository/materials?name=...
   * Public. Returns approved materials whose name contains the search query.
   */
  @Get('materials')
  searchMaterials(@Query('name') name: string) {
    return this.repositoryService.searchMaterials(name);
  }
}
