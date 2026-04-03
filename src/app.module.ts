import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

// Auth & RBAC
import { AuthModule } from './modules/auth/auth.module';

// User management
import { AdminModule } from './modules/admin/admin.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';

// Document workflow (M-01 refactored + M-03)
import { StudentModule } from './modules/student/student.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { DocumentsModule } from './modules/documents/documents.module';

// Full-text requests (M-04)
import { FulltextModule } from './modules/fulltext/fulltext.module';

// Notifications (M-01 table)
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ConfigModule allows reading environment variables from .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Supabase client provider
    DatabaseModule,

    // Auth + RBAC (login, logout, /me, guards)
    AuthModule,

    // User provisioning
    AdminModule,
    SuperadminModule,

    // Document upload (student-scoped, M-01 refactored)
    StudentModule,

    // Legacy search (M-01 refactored)
    RepositoryModule,

    // Full document management API (M-03)
    DocumentsModule,

    // Guest full-text requests (M-04)
    FulltextModule,

    // In-app notifications (M-01 notifications table)
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
