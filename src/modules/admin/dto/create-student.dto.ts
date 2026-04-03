import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateStudentDto {
  @IsEmail({}, { message: 'Must provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsIn(['IS', 'IT', 'CS'], { message: 'Department must be IS, IT, or CS.' })
  department: string;
}
