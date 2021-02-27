import { Injectable } from '@nestjs/common';
import { Game, IGame } from '../entity/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { User } from '../entity/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  getGameInfo(): Promise<Game> {
    return this.gameRepository.findOne({ id: 1 });
  }

  addGameInfo(game: IGame): Promise<InsertResult> {
    return this.gameRepository.insert(game);
  }
  getUsers(): Promise<User[]> {
    return this.userRepository.find({ userStatus: 'authed' });
  }
}
