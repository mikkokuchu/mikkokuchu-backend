import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../entity/game.entity';
import { Repository } from 'typeorm';
import { IUser, User } from '../entity/user.entity';
import { IMission, Mission } from '../entity/mission.entity';
import { MissionTransaction } from '../entity/missionTransaction.entity';
import { AppService } from '../app.service';
import axios from 'axios';
import { lineToken } from '../line';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(MissionTransaction)
    private missionTransacrionRepository: Repository<MissionTransaction>, // @Inject(AppService) // private readonly appService: AppService,
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

  getMissionTransaction(): Promise<MissionTransaction[]> {
    return this.missionTransacrionRepository.find({
      relations: ['mission', 'sender'],
    });
  }

  async setMissionResult(id: number, success: boolean): Promise<any> {
    const missionTransaction = await this.missionTransacrionRepository.findOne({
      id,
    });
    await this.replyMessage(
      missionTransaction.replyToken,
      success ? 'ミッション成功！' : 'ミッション失敗',
    );
    await this.missionTransacrionRepository.delete(missionTransaction);
  }

  async replyMessage(token: string, message: string) {
    const replydata = {
      replyToken: token,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
    // よくない
    try {
      await axios.post('https://api.line.me/v2/bot/message/reply', replydata, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineToken}`,
        },
      });
    } catch (e) {
      console.log(e);
    }
  }
}
