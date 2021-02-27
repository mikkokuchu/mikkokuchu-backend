import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Mission } from '../entity/mission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Mission])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
