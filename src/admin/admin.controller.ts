import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { AdminService } from './admin.service';
import { Mission } from '../entity/mission.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get('/user')
  getAdminUsers(): Promise<User[]> {
    return this.adminService.getAdminUsers();
  }
  @Post('/user/:id')
  setAdminUsers(@Body() b, @Param() params): Promise<any> {
    return this.adminService.updateAdminUser(params.id, b);
  }

  @Get('/mission')
  getMissions(): Promise<Mission[]> {
    return this.adminService.getMissions();
  }
}
