import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';

// The AuthModule now strictly relies on the Supabase client provided by DatabaseModule
@Module({
  imports: [
    // DatabaseModule provides our DatabaseService which initializes the Supabase client
    DatabaseModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
