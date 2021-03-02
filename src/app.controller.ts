import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { emitKeypressEvents } from 'readline';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/bot/webhook')
  @HttpCode(200)
  async postWebhook(@Body() b) {
    // console.log(b);
    for (const event of b.events) {
      const lineId = event.source.userId;
      const sendUser = await this.appService.getUser(lineId);
      const replyToken = event.replyToken;
      //　スタンプが送られたとき
      if (event.message.type === 'sticker') {
        continue;
      }

      const sendText = event.message.text;
      // console.log(sendText);
      //　ユーザ　が登録されていないとき
      if (!sendUser) {
        await this.appService.replyMessage(
          replyToken,
          'ユーザが登録されていません。\nメッセージで全体に公開される名前を打ってください。\n同時に次回のイベントの参加登録もされます。',
        );
        await this.appService.addUser(lineId);
        continue;
      }
      // pendingユーザの処理
      if (sendUser.userStatus == 'pending' && event.message.type === 'text') {
        if (sendText && sendText.startsWith('>')) {
          await this.appService.replyMessage(
            replyToken,
            'ユーザが登録されていません。\nメッセージで全体に公開される名前を打ってください。\n同時に次回のイベントの参加登録もされます。',
          );
          continue;
        }
        await this.appService.registerUser(lineId, sendText);
        await this.appService.replyMessage(
          replyToken,
          sendText + 'で登録しました。',
        );
        continue;
      }
      // コマンドの処理
      if (sendText && sendText.startsWith('>')) {
        const command = sendText.slice(1).trim();
        switch (command) {
          case '密告':
            await this.appService.updatePendingCommand(lineId, 'mikkoku');
            await this.appService.replyMessage(
              replyToken,
              '数字をタイピングして下さい。',
            );
            break;
          case 'ミッション':
            await this.appService.updatePendingCommand(lineId, 'mission');
            await this.appService.replyMissions(replyToken);
            break;
          case 'ライフ':
            await this.appService.replyMessage(
              replyToken,
              sendUser.userName + 'の残りライフ:' + sendUser.lifeCount,
            );
            break;
          default:
            break;
        }
        continue;
      }
      // コマンドの返信処理
      switch (sendUser.pendingCommand) {
        case 'mikkoku':
          const mikkokuResult: boolean = await this.appService.validateCode(
            sendUser,
            sendText,
          );
          if (mikkokuResult) {
            await this.appService.replyMessage(replyToken, '密告成功！');
          } else {
            await this.appService.replyMessage(replyToken, '密告失敗!');
          }
          break;
        case 'mission':
          await this.appService.missionflow(replyToken, event, sendUser);
          break;
        case '':
          break;
      }
    }
    return 'ok';
  }
}

const testJson = {
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
