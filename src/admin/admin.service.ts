import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../entity/game.entity';
import { Repository } from 'typeorm';
import { IUser, User } from '../entity/user.entity';
import { IMission, Mission } from '../entity/mission.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
  ) {}

  getAdminUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  updateAdminUser(id: number, user: IUser) {
    return this.userRepository.update({ id }, user);
  }

  getMissions(): Promise<Mission[]> {
    return this.missionRepository.find();
  }

  updateMission(id: number, mission: IMission) {
    return this.missionRepository.update({ id }, mission);
  }
}
