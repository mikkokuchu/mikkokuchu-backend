import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entity/user.entity';
import { MikkokuTransaction } from './entity/mikkokuTransaction.entity';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './entity/notification.entity';
import { GameModule } from './game/game.module';
import { Mission } from './entity/mission.entity';
import { Game } from './entity/game.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/sqlite.db',
      entities: [User, MikkokuTransaction, Notification, Game, Mission],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([MikkokuTransaction, User]),
    NotificationModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
