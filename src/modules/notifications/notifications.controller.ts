import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('notifications')
@UseGuards(SupabaseGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   * Protected. Returns all notifications for the authenticated user, newest first.
   */
  @Get()
  getNotifications(@Request() req: any) {
    return this.notificationsService.getNotifications(req.user.id);
  }

  /**
   * PATCH /api/notifications/read-all
   * Protected. Marks all unread notifications as read.
   */
  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * PATCH /api/notifications/:id/read
   * Protected. Marks a single notification as read.
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}
