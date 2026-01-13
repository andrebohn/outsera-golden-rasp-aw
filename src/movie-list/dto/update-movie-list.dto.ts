import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieListDto } from './create-movie-list.dto';

export class UpdateMovieListDto extends PartialType(CreateMovieListDto) {}
