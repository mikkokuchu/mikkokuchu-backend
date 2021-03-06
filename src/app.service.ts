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
import { Cron } from '@nestjs/schedule';
// import jimp from 'jimp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jimp = require('jimp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const QRReader = require('qrcode-reader');
import jsQR from 'jsqr';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jpeg = require('jpeg-js');

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
          (codeFindResult.lifeCount - 1) +
          '個です',
      );
      if (codeFindResult.lifeCount == 1) {
        await this.sendBroadCastMessage(
          `${codeFindResult.userName} さんはライフがなくなりました！`,
        );
      }
      return true;
    }
  }

  async replyMissions(token: string) {
    const mis = [11, 12];
    const now = new Date().getTime();
    if (1615090200000 < now && now < 1615091400000) {
      mis.unshift(1);
    } else if (1615092000000 < now && now < 1615094400000) {
      mis.unshift(2);
    } else if (1615095000000 < now && now < 1615096800000) {
      mis.unshift(3);
    } else if (1615097100000 < now && now < 1615098000000) {
      mis.unshift(4);
    } else if (1615098600000 < now && now < 1615100400000) {
      mis.unshift(5);
    }

    const missions = await this.missionRepository.find();
    const replyData = {
      type: 'carousel',
      contents: [],
    };
    console.log(missions);
    missions.forEach((mission) => {
      if (!mis.includes(mission.id)) {
        return;
      }
      //console.log(mission.title);
      const childItem = JSON.parse(JSON.stringify(BubbleTemplate));
      childItem.hero.url = 'https://mikkoku.ciebus.net/' + mission.id + '.png';
      childItem.hero.action.uri =
        'https://mikkoku.ciebus.net/' + mission.id + '.png';
      // childItem.body.contents[0].text = mission.title;
      // childItem.body.contents[1].text = mission.description;
      // childItem.body.contents[2].text = mission.penaltyText;
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

  async sendBroadCastMapMessage(data: object) {
    const sendBody = {
      to: (await this.userRepository.find({ userStatus: 'authed' })).map(
        (m) => m.lineId,
      ),
      messages: [
        {
          type: 'flex',
          altText: 'This is a Flex Message',
          contents: data,
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
            await this.replyMessage(token, '続けて写真を送信してください。');
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
          const ddd = fs.readFileSync(`./client/${message.id}.jpg`);
          const rawImageData = jpeg.decode(ddd, { useTArray: true });
          const code = jsQR(
            rawImageData.data,
            rawImageData.width,
            rawImageData.height,
          );
          /*const value = await new Promise((resolve, reject) => {
            qr.callback = (err, v) => (err != null ? reject(err) : resolve(v));
            qr.decode(img.bitmap);
          }).catch(() => {
            this.replyMessage(
              token,
              'QRが認識できませんでした。もう一度撮影してください。',
            );
          });
           */
          if (!code) {
            await this.replyMessage(
              token,
              'QRが認識できませんでした。もう一度撮影してください。',
            );
            return;
          }
          console.log(code.data);
          if (JSON.parse(code.data).value === '11') {
            await this.replyMessage(
              token,
              'ミッション成功！ライフが１増えます',
            );
            await this.userRepository.update(sendUser, {
              lifeCount: sendUser.lifeCount + 1,
            });
          } else if (
            JSON.parse(code.data).value === '12' ||
            JSON.parse(code.data).value === '13' ||
            JSON.parse(code.data).value === '14'
          ) {
            await this.replyMessage(token, 'ミッション失敗！');
            const mapTemp = JSON.parse(JSON.stringify(mapTemplate));
            switch (JSON.parse(code.data).value) {
              case '12':
                mapTemp.hero.url += '1a.png';
                mapTemp.hero.action.uri += '1a.png';
                mapTemp.body.contents[0].text = `${sendUser.userName} さんがミッションに失敗しました。${sendUser.userName}さんは画像の場所にいます！`;
                break;
              case '13':
                mapTemp.hero.url += '1b.png';
                mapTemp.hero.action.uri += '1b.png';
                mapTemp.body.contents[0].text = `${sendUser.userName} さんがミッションに失敗しました。${sendUser.userName}さんは画像の場所にいます！`;
                break;
              case '14':
                mapTemp.hero.url += '1c.png';
                mapTemp.hero.action.uri += '1c.png';
                mapTemp.body.contents[0].text = `${sendUser.userName} さんがミッションに失敗しました。${sendUser.userName}さんは画像の場所にいます！`;
                break;
            }
            await this.sendBroadCastMapMessage(mapTemp);
          } else if (JSON.parse(code.data).value === '21') {
            await this.replyMessage(
              token,
              'ミッション成功！ライフが２増えます',
            );
            await this.userRepository.update(sendUser, {
              lifeCount: sendUser.lifeCount + 2,
            });
          } else if (
            JSON.parse(code.data).value === '22' ||
            JSON.parse(code.data).value === '23' ||
            JSON.parse(code.data).value === '24'
          ) {
            await this.replyMessage(
              token,
              'ミッション失敗。ライフが２減ります',
            );
            await this.userRepository.update(sendUser, {
              lifeCount: sendUser.lifeCount - 2,
            });
          } else if (JSON.parse(code.data).value === '4') {
            await this.replyMessage(token, 'ミッション成功！');
            if (
              !(await this.missionTransactionRepository.findOne({
                sender: sendUser,
              }))
            ) {
              await this.missionTransactionRepository.insert({
                mission: await this.missionRepository.findOne({
                  id: Number(4),
                }),
                pending: true,
                sender: sendUser,
                imageUrl: `none`,
                addTime: new Date().getTime(),
                replyToken: token,
                status: true,
              });
            }
          } else {
            await this.replyMessage(
              token,
              'QRが認識できませんでした。もう一度撮影してください。（R1）',
            );
          }
        } else {
          await this.missionTransactionRepository.insert({
            mission: await this.missionRepository.findOne({
              id: Number(command),
            }),
            pending: true,
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

  @Cron('0 0 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async startGame() {
    console.log('start game');
    await this.sendBroadCastMessage('～～ゲーム開始～～');
    // console.log('start game');
  }

  @Cron('1 0 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async passive1_start() {
    await this.sendBroadCastMessage(
      'クエスト１が開始されました！クエストを確認してください。',
    );
    console.log('p1 start');
  }

  @Cron('2 0 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async passive2_start() {
    await this.sendBroadCastMessage(
      'クエスト２が開始されました！クエストを確認してください。',
    );
    console.log('p2 start');
  }

  @Cron('0 10 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission1_start() {
    await this.sendBroadCastMessage(
      'ミッション１が開始されました！クエストを確認してください。',
    );
    console.log('m1 start');
  }

  @Cron('0 30 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission1_end() {
    await this.sendBroadCastMessage('ミッション１が終了しました');
    console.log('m1 end');
    const userlist = await this.userRepository.find({
      where: {
        userStatus: 'authed',
      },
    });
    for (const user of userlist) {
      const transactions = await this.missionTransactionRepository.find({
        where: {
          sender: user,
          status: true,
          mission: await this.missionRepository.findOne({ id: 1 }),
        },
      });
      console.log(transactions);
      if (transactions.length == 0) {
        await this.userRepository.update(user, {
          lifeCount: user.lifeCount - 1,
        });
      }
    }
  }

  @Cron('0 40 13 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission2_start() {
    await this.sendBroadCastMessage(
      'ミッション２が開始されました！クエストを確認してください。',
    );
    console.log('m2 start');
  }

  @Cron('0 20 14 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission2_end() {
    await this.sendBroadCastMessage('ミッション２が終了しました');
    console.log('m2 end');
  }

  @Cron('0 30 14 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission3_start() {
    await this.sendBroadCastMessage(
      'ミッション３が開始されました！クエストを確認してください。',
    );
    console.log('m3 start');
  }

  @Cron('0 0 15 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission3_end() {
    await this.sendBroadCastMessage('ミッション３が終了しました');
    console.log('m3 end');
  }

  @Cron('0 5 15 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission4_start() {
    await this.sendBroadCastMessage(
      'ミッション４が開始されました！クエストを確認してください。',
    );
    console.log('m4 start');
  }

  @Cron('0 15 15 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission4_say_penarty() {
    console.log('m4 start');
    await this.sendBroadCastMessage(
      'ペナルティの内容を公表します。ペナルティは「吉田南構内の閉鎖」です！閉鎖されたくなければ、クスノキにて消毒せよ',
    );
  }

  @Cron('0 20 10 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission4_end() {
    await this.sendBroadCastMessage('ミッション４が終了しました');
    console.log('m4 end');
    const userlist = await this.userRepository.find({
      where: {
        userStatus: 'authed',
      },
      relations: ['missionTransactions'],
    });
    const transactions = await this.missionTransactionRepository.find({
      where: {
        status: true,
        mission: await this.missionRepository.findOne({ id: 4 }),
      },
    });
    console.log(transactions);
    if (userlist.length != transactions.length) {
      await this.sendBroadCastMessage(
        '全員がミッションを達成できなかったため、吉田南構内が閉鎖されます。',
      );
    }
  }

  @Cron('0 30 15 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission5_start() {
    await this.sendBroadCastMessage(
      'ミッション５が開始されました！クエストを確認してください。',
    );
    console.log('m5 start');
  }

  @Cron('0 0 16 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async mission5_end() {
    await this.sendBroadCastMessage('ミッション５が終了しました');
    console.log('m5 end');
    const mission5Transactions = await this.missionTransactionRepository.find({
      where: { mission: await this.missionRepository.findOne({ id: 5 }) },
      relations: ['sender'],
    });
    for (const t of mission5Transactions) {
      if (t.status) {
        await this.userRepository.update(t.sender, {
          lifeCount: t.sender.lifeCount + 1,
        });
      }
    }
    // ww
    const users = await this.userRepository.find({
      where: { userStatus: 'authed' },
    });
    for (const t of users) {
      await this.userRepository.update(t, { lifeCount: t.lifeCount - 3 });
    }
    // w
  }

  @Cron('1 0 16 7 * *', {
    timeZone: 'Asia/Tokyo',
  })
  async gameEnd() {
    console.log('end game');
    await this.sendBroadCastMessage(
      'ゲーム終了です。クスノキ前本部に集合してください',
    );
  }
}

const BubbleTemplate = {
  type: 'bubble',
  hero: {
    type: 'image',
    url: 'https://mikkoku.ciebus.net/mission1.png',
    size: 'full',
    aspectRatio: '16:9',
    aspectMode: 'cover',
    action: {
      type: 'uri',
      uri: 'https://mikkoku.ciebus.net/mission1.png',
    },
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
const mapTemplate = {
  type: 'bubble',
  hero: {
    type: 'image',
    url: 'https://mikkoku.ciebus.net/map_',
    size: 'full',
    aspectRatio: '20:13',
    aspectMode: 'cover',
    action: {
      type: 'uri',
      uri: 'https://mikkoku.ciebus.net/map_',
    },
  },
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: 'aaa',
        wrap: true,
      },
    ],
  },
};
