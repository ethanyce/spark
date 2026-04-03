import { IsString, IsIn, IsOptional } from 'class-validator';

export class ReviewSubmissionDto {
  @IsString()
  @IsIn(['approve', 'reject', 'revise'], {
    message: 'Decision must be one of: approve, reject, revise.',
  })
  decision: 'approve' | 'reject' | 'revise';

  @IsOptional()
  @IsString()
  feedback?: string;
}
