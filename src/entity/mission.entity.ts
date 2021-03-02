import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { MissionTransaction } from './missionTransaction.entity';

@Entity()
export class Mission {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column({ default: '' })
  title: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  penaltyText: string;

  @Column()
  startTime: number;

  @Column()
  endTime: number;

  @OneToMany((type) => MissionTransaction, (object) => object.mission)
  transactions: MissionTransaction[];

  @Column({ default: 'QR' })
  missionType: 'QR' | 'answer' | 'image';

  @ManyToOne((type) => Game, (object) => object.missions)
  game: Game;
}

export interface IMission {
  id?: number;
  title: string;
  startTime: number;
  endTime: number;
  missionType: 'QR' | 'answer' | 'image';
  game?: Game;
}
