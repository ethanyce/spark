import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { StudentModule } from './modules/student/student.module';
import { RepositoryModule } from './modules/repository/repository.module';

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

    AdminModule,
    SuperadminModule,
    StudentModule,
    RepositoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}