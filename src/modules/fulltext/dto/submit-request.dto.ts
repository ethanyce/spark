import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn, IsUUID } from 'class-validator';

export class SubmitFulltextRequestDto {
  @IsUUID()
  @IsNotEmpty()
  document_id: string;

  @IsString()
  @IsNotEmpty()
  requester_name: string;

  @IsEmail({}, { message: 'Must provide a valid email address.' })
  @IsNotEmpty()
  requester_email: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsIn(['IS', 'IT', 'CS', 'Other'], {
    message: 'Department must be IS, IT, CS, or Other.',
  })
  department: string;
}
