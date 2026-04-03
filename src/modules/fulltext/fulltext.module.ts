import { Module } from '@nestjs/common';
import { FulltextService } from './fulltext.service';
import { FulltextController } from './fulltext.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [FulltextService],
  controllers: [FulltextController],
})
export class FulltextModule {}
