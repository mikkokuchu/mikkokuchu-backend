import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entity/user.entity';
import { MikkokuTransaction } from './entity/mikkokuTransaction.entity';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './entity/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/sqlite.db',
      entities: [User, MikkokuTransaction, Notification],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([MikkokuTransaction, User]),
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
