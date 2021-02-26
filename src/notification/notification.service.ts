import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { INotification, Notification } from '../entity/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(): Promise<Notification[]> {
    return this.notificationRepository.find();
  }

  async addNotification(notification: INotification): Promise<InsertResult> {
    return this.notificationRepository.insert(notification);
  }
}
