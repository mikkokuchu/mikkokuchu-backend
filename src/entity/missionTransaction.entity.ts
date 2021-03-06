import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Mission } from './mission.entity';

@Entity()
export class MissionTransaction {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @ManyToOne((type) => User, (object) => object.missionTransactions)
  sender: User;

  @Column({ default: '' })
  imageUrl: string;

  @Column()
  status: boolean;

  @Column()
  pending: boolean;

  @Column({ default: '' })
  replyToken: string;

  @Column()
  addTime: number;

  @ManyToOne((type) => Mission, (object) => object.transactions)
  mission: Mission;
}
