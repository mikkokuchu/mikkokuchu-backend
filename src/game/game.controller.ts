import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { GameService } from './game.service';
import { Game } from '../entity/game.entity';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getGameInfo() {
    return this.gameService.getGameInfo();
  }

  @Post()
  addGameInfo(@Body() b) {
    return this.gameService.addGameInfo(b);
  }
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/user')
  getUser() {
    return this.gameService.getUsers();
  }
}
