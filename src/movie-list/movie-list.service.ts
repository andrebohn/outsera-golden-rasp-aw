import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { CreateMovieListDto } from './dto/create-movie-list.dto';
import { UpdateMovieListDto } from './dto/update-movie-list.dto';
import { MovieList } from './entities/movie-list.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

type IntervalItem = {
  producer: string;
  interval: number | null;
  previousWin: number;
  followingWin: number | null;
};

type ProducerItem = {
  producer: string;
  year: number;
};

@Injectable()
export class MovieListService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MovieListService.name);

  constructor(
    @InjectRepository(MovieList)
    private movieListRepository: Repository<MovieList>,
  ) { }

  create(createMovieListDto: CreateMovieListDto) {
    return this.movieListRepository.save(createMovieListDto);
  }

  findAll() {
    return this.movieListRepository.find();
  }

  findOne(id: number) {
    return this.movieListRepository.findOneBy({ id });
  }

  update(id: number, updateMovieListDto: UpdateMovieListDto) {
    return this.movieListRepository.update(id, updateMovieListDto);
  }

  remove(id: number) {
    return this.movieListRepository.delete(id);
  }

  async onApplicationBootstrap() {
    this.logger.log('Starting CSV data loading...');
    await this.readFileData();
  }

  async readFileData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const csvMovieFile = path.join(process.cwd(), 'files/Movielist.csv');

      if (!fs.existsSync(csvMovieFile)) {
        this.logger.warn(`CSV file not found at: ${csvMovieFile}`);
        resolve();
        return;
      }

      let processedLines = 0;
      let errorCount = 0;

      const stream = fs
        .createReadStream(csvMovieFile)
        .pipe(csvParser({ separator: ';' }));

      const insertMovie = async (data: any) => {
        try {
          const movie = new MovieList();
          movie.year = parseInt(data.year.trim(), 10);
          movie.title = data.title?.trim() || '';
          movie.studios = data.studios?.trim() || '';
          movie.producers = data.producers?.trim() || '';
          movie.winner =
            data.winner && data.winner.toLowerCase().trim() === 'yes';

          await this.movieListRepository.save(movie);
          processedLines++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Error saving movie: ${error.message} - Data: ${JSON.stringify(data)}`,
          );
        }
      };

      const lines: any[] = [];

      stream
        .on('data', (data) => {
          lines.push(data);
        })
        .on('end', async () => {
          for (const row of lines) {
            await insertMovie(row);
          }
          this.logger.log(
            `CSV file reading completed. ${processedLines} movies loaded, ${errorCount} errors.`,
          );
          resolve();
        })
        .on('error', (error) => {
          this.logger.error(`Error reading CSV file: ${error.message}`);
          reject(error);
        });
    });
  }

  parseProducers(producersStr: string): string[] {
    return (producersStr ?? "")
      .split(/\s*,\s*and\s+|\s*,\s*|\s+and\s+/i)
      .map(p => p.trim())
      .filter(Boolean);
  }

  async buildProducerWinList(): Promise<ProducerItem[]> {
    const producerWins: ProducerItem[] = [];
    const producerWinsList = await this.movieListRepository.find({
      where: { winner: true },
      order: { year: 'ASC' },
    });

    for (const producerWin of producerWinsList) {
      const year = producerWin.year;
      const producers = this.parseProducers(producerWin.producers);
      for (const producer of producers) {
        producerWins.push({ producer, year });
      }
    }

    return producerWins;
  }

  async buildIntervals(): Promise<IntervalItem[]> {
    const intervals: IntervalItem[] = [];

    const producerWins = await this.buildProducerWinList();

    producerWins.forEach((producerWin) => {
      const interval = intervals.find(
        (prodWin) => prodWin.producer === producerWin.producer,
      );
      if (interval) {
        if (interval.followingWin !== null) {
          const open = intervals.find(
            (prodInterval) =>
              prodInterval.producer === producerWin.producer &&
              prodInterval.followingWin === null,
          );
          if (open) {
            open.followingWin = producerWin.year;
            open.interval = producerWin.year - open.previousWin;
          }
        } else {
          interval.followingWin = producerWin.year;
          interval.interval = producerWin.year - interval.previousWin;
        }
      }
      intervals.push({
        producer: producerWin.producer,
        previousWin: producerWin.year,
        followingWin: null,
        interval: null,
      });
    });

    return intervals;
  }

  async getMinMaxIntervals(): Promise<{
    min: IntervalItem[];
    max: IntervalItem[];
  }> {
    const intervals = await this.buildIntervals();
    const validIntervals = intervals
      .map((buildInterval) => buildInterval.interval)
      .filter(
        (typeInterval): typeInterval is number =>
          typeof typeInterval === 'number',
      );

    if (validIntervals.length === 0) {
      return { min: [], max: [] };
    }

    const minInterval = Math.min(...validIntervals);
    const maxInterval = Math.max(...validIntervals);

    const minIntervals = intervals.filter((i) => i.interval === minInterval);
    const maxIntervals = intervals.filter((i) => i.interval === maxInterval);

    return { min: minIntervals, max: maxIntervals };
  }
}
