import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MikkokuTransaction } from './mikkokuTransaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column()
  userStatus: 'pending' | 'authed';

  @Column({ default: '' })
  lineId: string;

  @Column({ default: '' })
  userName: string;

  @Column()
  pendingCommand: '' | 'mikkoku' | 'mission';

  @Column()
  lifeCount: number;

  @Column({ default: false })
  testAccount: boolean;

  @Column({ default: '' })
  code: string;

  @Column()
  joinTime: number;

  @OneToMany((type) => MikkokuTransaction, (object) => object.sender)
  mikkokus: MikkokuTransaction[];
}
