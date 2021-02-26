import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotification() {
    return this.notificationService.getNotifications();
  }

  // TODO set dto
  @Post()
  async addNotification(@Body() b) {
    // TODO よくない
    b.time = new Date().getTime();
    await this.notificationService.addNotification(b);
    return 'ok';
  }
}
