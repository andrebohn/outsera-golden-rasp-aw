import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MovieListService } from './movie-list.service';
import { CreateMovieListDto } from './dto/create-movie-list.dto';
import { UpdateMovieListDto } from './dto/update-movie-list.dto';

@Controller('movie-list')
export class MovieListController {
  constructor(private readonly movieListService: MovieListService) {}

  @Post()
  create(@Body() createMovieListDto: CreateMovieListDto) {
    return this.movieListService.create(createMovieListDto);
  }

  @Get()
  findAll() {
    return this.movieListService.findAll();
  }

  @Get('min-max-intervals')
  async getMinMaxIntervals() {
    try {
      return await this.movieListService.getMinMaxIntervals();
    } catch (err: any) {
      throw new InternalServerErrorException(
        err?.message ?? 'Erro ao calcular intervals',
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMovieListDto: UpdateMovieListDto,
  ) {
    const foundMovie = await this.movieListService.findOne(+id);
    if (!foundMovie) {
      throw new NotFoundException(`Filme com ID ${id} não encontrado`);
    }
    return this.movieListService.update(+id, updateMovieListDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const foundMovie = await this.movieListService.findOne(+id);
    if (!foundMovie) {
      throw new NotFoundException(`Filme com ID ${id} não encontrado`);
    }
    return this.movieListService.remove(+id);
  }
}
