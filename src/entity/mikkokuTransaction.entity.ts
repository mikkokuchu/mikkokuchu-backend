import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class MikkokuTransaction {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @ManyToOne((type) => User, (object) => object.mikkokus)
  sender: User;

  @Column()
  code: string;

  @Column()
  status: boolean;

  @Column()
  mikkokuTime: number;

  @Column({ default: '' })
  toLineId: string;
}
