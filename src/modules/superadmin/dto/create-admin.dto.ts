import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAdminDto {
  @IsEmail({}, { message: 'Must provide a valid email address.' })
  @IsNotEmpty()
  email: string;
}
