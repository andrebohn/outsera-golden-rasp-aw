import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MovieList {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  year: number;

  @Column()
  title: string;

  @Column()
  studios: string;

  @Column()
  producers: string;

  @Column()
  winner: boolean;
}
