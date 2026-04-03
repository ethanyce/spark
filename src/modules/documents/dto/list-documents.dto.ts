import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListDocumentsDto {
  @IsOptional()
  @IsIn(['IS', 'IT', 'CS'], { message: 'Department must be IS, IT, or CS.' })
  department?: string;

  @IsOptional()
  @IsIn(['thesis', 'capstone'], { message: 'Type must be thesis or capstone.' })
  type?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  year?: number;

  /** Filter by track/specialization (partial match) */
  @IsOptional()
  @IsString()
  track?: string;

  /** Filter by a single keyword contained in the keywords JSON array */
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
