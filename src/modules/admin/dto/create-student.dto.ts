import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @IsEmail({}, { message: 'Must provide a valid email address.' })
  @IsNotEmpty()
  email: string;
}
