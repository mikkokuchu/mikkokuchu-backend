import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Mission {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column({ default: '' })
  title: string;

  @ManyToOne((type) => Game, (object) => object.missions)
  game: Game;
}
