import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Mission } from '../entity/mission.entity';
import { MissionTransaction } from '../entity/missionTransaction.entity';
import { AppModule } from '../app.module';
import { AppService } from '../app.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Mission, MissionTransaction]),
    // AppModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
