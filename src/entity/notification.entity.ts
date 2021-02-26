import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('increment')
  @Index()
  id: number;

  @Column({ default: '' })
  title: string;

  @Column({ default: '' })
  genre: string;

  @Column({ default: '' })
  text: string;

  @Column()
  time: number;
}

export interface INotification {
  id?: number;
  title: string;
  genre: string;
  text: string;
  time: number;
}
