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
import { AdminModule } from './admin/admin.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MissionTransaction } from './entity/missionTransaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/sqlite.db',
      entities: [
        User,
        MikkokuTransaction,
        Notification,
        Game,
        Mission,
        MissionTransaction,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      MikkokuTransaction,
      User,
      Mission,
      MissionTransaction,
    ]),
    NotificationModule,
    GameModule,
    AdminModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
