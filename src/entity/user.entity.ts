import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MikkokuTransaction } from './mikkokuTransaction.entity';
import { Exclude } from 'class-transformer';
import { MissionTransaction } from './missionTransaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column()
  @Exclude()
  userStatus: 'pending' | 'authed';

  @Column({ default: '' })
  @Exclude()
  lineId: string;

  @Column({ default: '' })
  userName: string;

  @Column()
  @Exclude()
  pendingCommand: '' | 'mikkoku' | 'mission';

  @Column({ default: '' })
  @Exclude()
  pendingMissionCommand: '' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q11' | 'q12';

  @Column()
  lifeCount: number;

  @Column({ default: false })
  @Exclude()
  testAccount: boolean;

  @Column({ default: '' })
  @Exclude()
  code: string;

  @Column()
  @Exclude()
  joinTime: number;

  @OneToMany((type) => MikkokuTransaction, (object) => object.sender)
  mikkokus: MikkokuTransaction[];

  @OneToMany((type) => MissionTransaction, (object) => object.sender)
  missionTransactions: MikkokuTransaction[];
}

export interface IUser {
  id?: number;
  userStatus: 'pending' | 'authed';
  lineId: string;
  userName: string;
  pendingCommand: '' | 'mikkoku' | 'mission';
  pendingMissionCommand: '' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q11' | 'q12';
  lifeCount: number;
  testAccount: boolean;
  code: string;
  joinTime: number;
  mikkokus?: MikkokuTransaction[];
}
