import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../entity/game.entity';
import { User } from '../entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, User])],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
