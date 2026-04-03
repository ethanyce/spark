import { IsIn, IsString } from 'class-validator';

export class UpdateFulltextRequestDto {
  @IsString()
  @IsIn(['fulfilled', 'denied'], {
    message: 'Status must be fulfilled or denied.',
  })
  status: 'fulfilled' | 'denied';
}
