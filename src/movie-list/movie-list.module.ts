import { Module } from '@nestjs/common';
import { MovieListService } from './movie-list.service';
import { MovieListController } from './movie-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieList } from './entities/movie-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovieList])],
  controllers: [MovieListController],
  providers: [MovieListService],
})
export class MovieListModule {}
