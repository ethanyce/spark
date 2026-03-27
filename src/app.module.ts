import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ConfigModule allows reading environment variables from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // DatabaseModule handles initializing and providing the Supabase Client
    DatabaseModule,

    // AuthModule encapsulates our Supabase Authentication logic
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}