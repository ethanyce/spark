import { Module } from '@nestjs/common';
import { RepositortController } from './repository.controller';
import { RepositoryService } from './repository.service';

@Module({
    controllers: [RepositortController],
    providers: [RepositoryService],
})

export class RepositoryModule {}