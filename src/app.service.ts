import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { MikkokuTransaction } from './entity/mikkokuTransaction.entity';
import axios from 'axios';
import { lineToken } from './line';
import { Mission } from './entity/mission.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MikkokuTransaction)
    private mikkokuTransactionRepository: Repository<MikkokuTransaction>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
  ) {}

  getUser(lineId: string): Promise<User> {
    return this.userRepository.findOne({ lineId });
  }

  addUser(lineId: string): Promise<any> {
    return this.userRepository.insert({
      userStatus: 'pending',
      pendingCommand: '',
      lineId,
      userName: '',
      lifeCount: 999,
      code: '123456',
      testAccount: false,
      joinTime: new Date().getTime(),
    });
  }

  registerUser(lineId: string, userName: string): Promise<any> {
    return this.userRepository.update(
      { lineId },
      {
        userName,
        userStatus: 'authed',
      },
    );
  }

  updatePendingCommand(
    lineId: string,
    pendingCommand: '' | 'mikkoku' | 'mission',
  ): Promise<any> {
    return this.userRepository.update(
      { lineId },
      {
        pendingCommand,
      },
    );
  }

  async validateCode(sendUser: User, code: string): Promise<boolean> {
    const codeFindResult = await this.userRepository.findOne({ code });
    if (!codeFindResult) {
      //コードが間違ってた時
      await this.mikkokuTransactionRepository.insert({
        sender: sendUser,
        code,
        status: false,
        mikkokuTime: new Date().getTime(),
      });
      return false;
    } else {
      if (codeFindResult.lineId == sendUser.lineId) {
        return false;
      }
      const usedReport = await this.mikkokuTransactionRepository.findOne({
        status: true,
        sender: sendUser,
        code,
      });
      if (usedReport) {
        return false;
      }
      // あってた時
      await this.mikkokuTransactionRepository.insert({
        sender: sendUser,
        code,
        status: true,
        toLineId: codeFindResult.lineId,
        mikkokuTime: new Date().getTime(),
      });
      await this.userRepository.update(
        { id: codeFindResult.id },
        { lifeCount: codeFindResult.lifeCount - 1 },
      );
      if (codeFindResult.testAccount) {
        console.log('test account');
        return true;
      }
      await this.sendMessage(
        codeFindResult.lineId,
        '密告されました。\n残りのライフは' +
          codeFindResult.lifeCount +
          '個です',
      );
      return true;
    }
  }

  async replyMissions(token: string) {
    const missions = await this.missionRepository.find();
    const replyData = {
      type: 'carousel',
      contents: [],
    };

    missions.forEach((mission) => {
      console.log(mission.title);
      const childItem = JSON.parse(JSON.stringify(BubbleTemplate));
      childItem.body.contents[0].text = mission.title;
      childItem.body.contents[1].text = mission.description;
      childItem.body.contents[2].text = mission.penaltyText;
      console.log(childItem.footer.contents[0].action.text);
      childItem.footer.contents[0].action.text = '>q' + mission.id;
      //console.log(childItem.body.contents[0].action.text);
      replyData.contents.push(childItem);
    });
    await this.replyFlexMessage(token, replyData);
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
    await axios.post('https://api.line.me/v2/bot/message/reply', replydata, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
    });
  }

  async replyFlexMessage(token: string, data: object) {
    const replydata = {
      replyToken: token,
      messages: [
        {
          type: 'flex',
          altText: 'This is a Flex Message',
          contents: data,
        },
      ],
    };
    // よくない
    const result = await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      replydata,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineToken}`,
        },
      },
    );
    console.log(result);
  }

  async sendMessage(to: string, message: string) {
    const sendBody = {
      to: to,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
    // よくない
    await axios.post('https://api.line.me/v2/bot/message/push', sendBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
    });
  }
}

const BubbleTemplate = {
  type: 'bubble',
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        weight: 'bold',
        size: 'xl',
        text: 'ミッション①',
      },
      {
        type: 'text',
        text: 'test text',
        wrap: true,
      },
      {
        type: 'text',
        text: 'test penalty text',
      },
    ],
  },
  footer: {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        style: 'link',
        height: 'sm',
        action: {
          type: 'message',
          label: 'このクエストを回答する',
          text: '>qtest',
        },
      },
      {
        type: 'spacer',
        size: 'sm',
      },
    ],
    flex: 0,
  },
};
