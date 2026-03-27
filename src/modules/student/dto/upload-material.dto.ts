import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UploadMaterialDto {
  @IsOptional()
  @IsDateString()
  publish_date?: string;

  @IsOptional()
  @IsString()
  version?: string;
}
