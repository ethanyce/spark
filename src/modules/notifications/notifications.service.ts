import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * getNotifications returns all notifications for the authenticated user,
   * newest first.
   */
  async getNotifications(userId: string) {
    const { data, error } = await this.databaseService.client
      .from('notifications')
      .select('id, type, message, is_read, reference_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * markAsRead flips is_read=true for a single notification owned by the user.
   */
  async markAsRead(notificationId: string, userId: string) {
    const { data: notification, error: fetchError } = await this.databaseService.client
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundException('Notification not found.');
    }

    const { data, error } = await this.databaseService.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Failed to mark notification as read.');
    return data;
  }

  /**
   * markAllAsRead flips is_read=true for all unread notifications owned by the user.
   */
  async markAllAsRead(userId: string) {
    const { error } = await this.databaseService.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new InternalServerErrorException('Failed to mark notifications as read.');
    return { message: 'All notifications marked as read.' };
  }
}
