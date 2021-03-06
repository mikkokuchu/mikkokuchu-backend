import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { AdminService } from './admin.service';
import { Mission } from '../entity/mission.entity';
import { MissionTransaction } from '../entity/missionTransaction.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('/user')
  getAdminUsers(): Promise<User[]> {
    return this.adminService.getAdminUsers();
  }
  @Post('/user/:id')
  setAdminUsers(@Body() b, @Param() params): Promise<any> {
    const tmp = JSON.parse(JSON.stringify(b));
    delete b.mikkokus;
    delete b.missionTransactions;
    return this.adminService.updateAdminUser(params.id, b);
  }

  @Get('/mission')
  getMissions(): Promise<Mission[]> {
    return this.adminService.getMissions();
  }
  @Post('/mission/:id')
  setMission(@Body() b, @Param() params): Promise<any> {
    // console.log(b);
    return this.adminService.updateMission(params.id, b);
  }

  @Get('/transaction')
  getMissionTransaction(): Promise<MissionTransaction[]> {
    return this.adminService.getMissionTransaction();
  }

  @Post('/transaction/:id')
  async setTransactionResult(@Body() b, @Param() params): Promise<any> {
    await this.adminService.setMissionResult(params.id, b.status);
    return 'ok';
  }
}
