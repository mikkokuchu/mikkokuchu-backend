import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MikkokuTransaction } from './mikkokuTransaction.entity';
import { Exclude } from 'class-transformer';

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
}
