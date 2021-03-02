import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { MikkokuTransaction } from './entity/mikkokuTransaction.entity';
import axios from 'axios';
import { lineToken } from './line';
import { Mission } from './entity/mission.entity';
import e from 'express';
import * as fs from 'fs';
import { MissionTransaction } from './entity/missionTransaction.entity';
// import jimp from 'jimp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jimp = require('jimp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRReader = require('qrcode-reader');

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MikkokuTransaction)
    private mikkokuTransactionRepository: Repository<MikkokuTransaction>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(MissionTransaction)
    private missionTransactionRepository: Repository<MissionTransaction>,
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
      //console.log(mission.title);
      const childItem = JSON.parse(JSON.stringify(BubbleTemplate));
      childItem.body.contents[0].text = mission.title;
      childItem.body.contents[1].text = mission.description;
      childItem.body.contents[2].text = mission.penaltyText;
      //console.log(childItem.footer.contents[0].action.text);
      childItem.footer.contents[0].action.text = '!q' + mission.id;
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
    // console.log(result);
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

  async missionflow(token: string, event: any, sendUser: User) {
    const message = event.message;
    if (message.type === 'text') {
      const sendText = message.text;
      if (sendText.startsWith('!')) {
        const command = sendText.slice(1).trim();
        switch (command) {
          case 'q1':
            await this.replyMessage(token, '続けて写真を送信してください。');
            break;
          case 'q2':
            await this.replyMessage(
              token,
              '続けてQRコードを送信してください。',
            );
            break;
          case 'q3':
            await this.replyMessage(token, '続けてコードを送信してください。');
            await this.userRepository.update(sendUser, {
              pendingCommand: 'mikkoku',
            });
            break;
          case 'q4':
            await this.replyMessage(
              token,
              '続けてQRコードを送信してください。',
            );
            break;
          case 'q5':
            await this.replyMessage(
              token,
              '電話をかけて、名前を電話先に伝えてください。',
            );
            break;
          case 'q11':
            await this.replyMessage(token, '続けて写真を送信してください。');
            break;
          case 'q12':
            await this.replyMessage(token, '続けて写真を送信してください。');
            break;
          default:
            break;
        }
        await this.userRepository.update(sendUser, {
          pendingMissionCommand: command,
        });
      }
    } else {
      if (message.type === 'image') {
        const res = await axios.get(
          `https://api-data.line.me/v2/bot/message/${message.id}/content`,
          {
            headers: {
              Authorization: `Bearer ${lineToken}`,
            },
            responseType: 'arraybuffer',
          },
        );
        fs.writeFileSync(
          `./client/${message.id}.jpg`,
          // @ts-ignore
          new Buffer.from(res.data),
          'binary',
        );
        const command = sendUser.pendingMissionCommand.slice(1).trim();
        //console.log(command);
        if (command === '2' || command === '4') {
          const img = await jimp.read(
            fs.readFileSync(`./client/${message.id}.jpg`),
          );
          const qr = new QRReader();
          const value = await new Promise((resolve, reject) => {
            qr.callback = (err, v) => (err != null ? reject(err) : resolve(v));
            qr.decode(img.bitmap);
          }).catch(() => {
            this.replyMessage(
              token,
              'QRが認識できませんでした。もう一度撮影してください。',
            );
          });
          // @ts-ignore
          if (value.result === 'true') {
            this.replyMessage(token, 'ミッション成功！');
            // @ts-ignore
          } else if (value.result === 'false') {
            this.replyMessage(token, 'ミッション失敗！');
          } else {
            this.replyMessage(
              token,
              'QRが認識できませんでした。もう一度撮影してください。１１２',
            );
          }
        } else {
          await this.missionTransactionRepository.insert({
            mission: await this.missionRepository.findOne({
              id: Number(command),
            }),
            sender: sendUser,
            imageUrl: `${message.id}.jpg`,
            addTime: new Date().getTime(),
            replyToken: token,
            status: false,
          });
        }
      }
    }
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
