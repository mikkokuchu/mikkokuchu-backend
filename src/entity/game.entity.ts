import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Mission } from './mission.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column({ default: '' })
  title: string;

  @Column()
  startTime: number;

  @Column()
  endTime: number;

  @OneToMany((type) => Mission, (object) => object.game)
  missions: Mission[];
}

export interface IGame {
  id?: number;
  title: string;
  startTime: number;
  endTime: number;
  missions?: Mission[];
}
