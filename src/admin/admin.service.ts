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
    return this.userRepository.find({
      relations: ['mikkokus', 'missionTransactions'],
    });
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
      where: {
        pending: true,
      },
      relations: ['mission', 'sender'],
    });
  }

  async setMissionResult(id: number, success: boolean): Promise<any> {
    const missionTransaction = await this.missionTransacrionRepository.findOne(
      {
        id,
      },
      { relations: ['sender', 'mission'] },
    );
    switch (missionTransaction.mission.id) {
      case 1:
        await this.replyMessage(
          missionTransaction.replyToken,
          success ? 'ミッション成功！' : 'ミッション失敗。',
        );
        if (!success) {
          /*
          await this.userRepository.update(missionTransaction.sender, {
            lifeCount: missionTransaction.sender.lifeCount - 1,
          });
          if (missionTransaction.sender.lifeCount == 1) {
            // TODO
            // DEAD
            await this.sendBroadCastMessage(
              `${missionTransaction.sender.userName} さんはライフがなくなりました！`,
            );
          }

           */
        }
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
      case 5:
        await this.replyMessage(
          missionTransaction.replyToken,
          success ? 'ミッション成功！' : 'ミッション失敗。',
        );
        break;
      case 11:
      case 12:
        await this.replyMessage(
          missionTransaction.replyToken,
          success ? 'ミッション成功！ライフが１増えます' : 'ミッション失敗。',
        );
        if (success) {
          await this.userRepository.update(missionTransaction.sender, {
            lifeCount: missionTransaction.sender.lifeCount + 1,
          });
        }
        break;
    }
    await this.missionTransacrionRepository.update(missionTransaction, {
      status: success,
      pending: false,
    });
  }

  async sendBroadCastMessage(message: string) {
    const sendBody = {
      to: (await this.userRepository.find({ userStatus: 'authed' })).map(
        (m) => m.lineId,
      ),
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
    // よくない
    await axios.post('https://api.line.me/v2/bot/message/multicast', sendBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
    });
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
